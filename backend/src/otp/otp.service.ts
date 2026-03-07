import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';
import { compareHash, generateOTP, hashValue } from '../common/utils/crypto.util';

@Injectable()
export class OtpService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(OtpService.name);
    private redisClient: RedisClientType;
    private readonly otpExpiry: number;
    private readonly otpLength: number;

    // High-performance in-memory fallback
    private memoryStore = new Map<string, { value: string; expiresAt: number }>();

    constructor(private configService: ConfigService) {
        this.otpExpiry = this.configService.get<number>('otp.expiry', 300);
        this.otpLength = this.configService.get<number>('otp.length', 6);
    }

    async onModuleInit() {
        const redisHost = this.configService.get<string>('redis.host');
        const redisPort = this.configService.get<number>('redis.port');
        const redisPassword = this.configService.get<string>('redis.password');

        this.redisClient = createClient({
            socket: {
                host: redisHost,
                port: redisPort,
            },
            password: redisPassword || undefined,
        });

        let lastErrorLogTime = 0;
        this.redisClient.on('error', (err) => {
            const now = Date.now();
            if (now - lastErrorLogTime > 60000) { // Log at most once per minute
                this.logger.warn('Redis connection failed, using in-memory fallback (suppressing further logs for 1 min)');
                lastErrorLogTime = now;
            }
        });

        this.redisClient.on('connect', () => {
            this.logger.log('Redis Client Connected');
        });

        try {
            await this.redisClient.connect();
        } catch (e) {
            this.logger.warn('Could not connect to Redis at startup, using in-memory fallback');
        }
    }

    async onModuleDestroy() {
        if (this.redisClient?.isOpen) {
            await this.redisClient.quit();
        }
    }

    /**
     * Generate and store OTP for a phone number
     */
    async generateAndStoreOTP(phoneNumber: string): Promise<string> {
        const otp = generateOTP(this.otpLength);
        const hashedOTP = hashValue(otp);

        const key = this.getOTPKey(phoneNumber);

        try {
            if (this.redisClient?.isOpen) {
                await this.redisClient.setEx(key, this.otpExpiry, hashedOTP);
            } else {
                this.memoryStore.set(key, {
                    value: hashedOTP,
                    expiresAt: Date.now() + (this.otpExpiry * 1000)
                });
            }
        } catch (e) {
            // Fallback to memory if redis fails during operation
            this.memoryStore.set(key, {
                value: hashedOTP,
                expiresAt: Date.now() + (this.otpExpiry * 1000)
            });
        }

        // Return plain OTP for SMS sending (never store this)
        return otp;
    }

    /**
     * Verify OTP against stored hash
     */
    async verifyOTP(phoneNumber: string, otp: string): Promise<boolean> {
        const key = this.getOTPKey(phoneNumber);
        let storedHash: string | null = null;

        try {
            if (this.redisClient?.isOpen) {
                storedHash = await this.redisClient.get(key);
            } else {
                const item = this.memoryStore.get(key);
                if (item && item.expiresAt > Date.now()) {
                    storedHash = item.value;
                } else {
                    this.memoryStore.delete(key);
                }
            }
        } catch (e) {
            const item = this.memoryStore.get(key);
            if (item && item.expiresAt > Date.now()) {
                storedHash = item.value;
            }
        }

        if (!storedHash) {
            return false; // OTP expired or doesn't exist
        }

        const isValid = compareHash(otp, storedHash);

        // Delete OTP after verification attempt (one-time use)
        if (isValid) {
            try {
                if (this.redisClient?.isOpen) {
                    await this.redisClient.del(key);
                }
                this.memoryStore.delete(key);
            } catch (e) {
                this.memoryStore.delete(key);
            }
        }

        return isValid;
    }

    /**
     * Check rate limiting for OTP requests
     */
    async checkRateLimit(phoneNumber: string): Promise<boolean> {
        const key = this.getRateLimitKey(phoneNumber);
        let attempts = 0;

        try {
            if (this.redisClient?.isOpen) {
                const val = await this.redisClient.get(key);
                attempts = val ? parseInt(val) : 0;
            } else {
                const item = this.memoryStore.get(key);
                if (item && item.expiresAt > Date.now()) {
                    attempts = parseInt(item.value);
                } else {
                    this.memoryStore.delete(key);
                }
            }
        } catch (e) {
            const item = this.memoryStore.get(key);
            if (item && item.expiresAt > Date.now()) {
                attempts = parseInt(item.value);
            }
        }

        const maxAttempts = this.configService.get<number>('otp.maxAttempts', 3);

        if (attempts >= maxAttempts) {
            return false; // Rate limit exceeded
        }

        return true;
    }

    /**
     * Increment rate limit counter
     */
    async incrementRateLimit(phoneNumber: string): Promise<void> {
        const key = this.getRateLimitKey(phoneNumber);
        const window = this.configService.get<number>('otp.rateLimitWindow', 600);

        try {
            if (this.redisClient?.isOpen) {
                const current = await this.redisClient.get(key);
                if (current) {
                    await this.redisClient.incr(key);
                } else {
                    await this.redisClient.setEx(key, window, '1');
                }
            } else {
                const item = this.memoryStore.get(key);
                let currentVal = 0;
                let expireTime = Date.now() + (window * 1000);

                if (item && item.expiresAt > Date.now()) {
                    currentVal = parseInt(item.value);
                    expireTime = item.expiresAt;
                }

                this.memoryStore.set(key, {
                    value: (currentVal + 1).toString(),
                    expiresAt: expireTime
                });
            }
        } catch (e) {
            const item = this.memoryStore.get(key);
            let currentVal = 0;
            let expireTime = Date.now() + (window * 1000);

            if (item && item.expiresAt > Date.now()) {
                currentVal = parseInt(item.value);
                expireTime = item.expiresAt;
            }

            this.memoryStore.set(key, {
                value: (currentVal + 1).toString(),
                expiresAt: expireTime
            });
        }
    }

    /**
     * Send OTP via MSG91 SMS. Falls back to console log if MSG91 not configured.
     *
     * MSG91 Setup:
     * 1. Sign up at msg91.com → get AUTH_KEY from Dashboard → API → Auth Token
     * 2. Create an OTP Template under SMS → Templates (DLT registered for India)
     *    - Template body must include ##OTP## placeholder, e.g.:
     *      "Your WhatsLeft verification code is ##OTP##. Valid for 5 minutes."
     * 3. Copy the Template ID and Sender ID into your .env
     */
    async sendOTP(phoneNumber: string, otp: string): Promise<void> {
        const authKey = this.configService.get<string>('MSG91_AUTH_KEY', '');
        const templateId = this.configService.get<string>('MSG91_TEMPLATE_ID', '');
        const senderId = this.configService.get<string>('MSG91_SENDER_ID', 'WHTLFT');

        if (!authKey || !templateId || authKey === 'REPLACE_ME') {
            // Dev fallback — OTP visible in backend terminal logs
            this.logger.warn(`[DEV] OTP for ${phoneNumber}: ${otp}  (MSG91 not configured — set MSG91_AUTH_KEY and MSG91_TEMPLATE_ID)`);
            return;
        }

        // MSG91 expects mobile number WITHOUT leading +, WITH country code
        // e.g. +917722097528 → 917722097528
        const mobile = phoneNumber.replace(/^\+/, '');

        const url = `https://control.msg91.com/api/v5/otp?template_id=${templateId}&mobile=${mobile}&authkey=${authKey}&otp=${otp}&sender=${senderId}&otp_expiry=${Math.ceil(this.otpExpiry / 60)}`;

        try {
            const response = await fetch(url, { method: 'POST' });
            const result = await response.json() as any;

            if (result?.type === 'success') {
                this.logger.log(`[MSG91] OTP sent to ${mobile}`);
            } else {
                this.logger.error(`[MSG91] Failed to send OTP to ${mobile}: ${JSON.stringify(result)}`);
                // Don't throw — OTP is stored; user will see error but can retry
            }
        } catch (err: any) {
            this.logger.error(`[MSG91] Network error sending OTP to ${mobile}: ${err?.message}`);
            // Don't throw — OTP stored in Redis; manual entry still possible
        }
    }

    private getOTPKey(phoneNumber: string): string {
        return `otp:${phoneNumber}`;
    }

    private getRateLimitKey(phoneNumber: string): string {
        return `otp:ratelimit:${phoneNumber}`;
    }
}
