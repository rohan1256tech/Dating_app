import {
    ForbiddenException,
    Injectable,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { hashValue } from '../common/utils/crypto.util';
import { UsersService } from '../users/users.service';
import { FirebaseAdminService } from './firebase-admin.service';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    
    // In-memory store: phone -> { code, expiresAt }
    private readonly devOtpStore = new Map<string, { code: string; expiresAt: number }>();

    constructor(
        private usersService: UsersService,
        private firebaseAdminService: FirebaseAdminService,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    async devSendOtp(phone: string): Promise<{ message: string }> {
        if (process.env.NODE_ENV === 'production') throw new ForbiddenException();
        this.devOtpStore.set(phone, { code: '123456', expiresAt: Date.now() + 10 * 60 * 1000 });
        this.logger.warn(`[DEV] OTP for ${phone}: 123456`);
        return { message: 'Dev OTP sent (use 123456)' };
    }

    async devVerifyOtp(phone: string, code: string): Promise<{ accessToken: string; refreshToken: string; user: any }> {
        if (process.env.NODE_ENV === 'production') throw new ForbiddenException();
        const entry = this.devOtpStore.get(phone);
        if (!entry || entry.code !== code || Date.now() > entry.expiresAt) {
            throw new UnauthorizedException('Invalid or expired dev OTP');
        }
        this.devOtpStore.delete(phone);
        
        let user = await this.usersService.findByPhoneNumber(phone);
        if (!user) user = await this.usersService.create(phone);
        
        await this.usersService.markAsVerified(user._id.toString());
        const tokens = await this.generateTokens(user._id.toString(), phone);
        const hashedRefreshToken = hashValue(tokens.refreshToken);
        await this.usersService.updateRefreshToken(user._id.toString(), hashedRefreshToken);
        
        return { ...tokens, user: { id: user._id, phoneNumber: user.phoneNumber, isVerified: true } };
    }

    /**
     * Verify a Firebase ID token obtained after successful phone OTP confirmation
     * on the frontend, then issue our own JWT access + refresh tokens.
     *
     * The frontend flow is:
     *  1. auth().signInWithPhoneNumber(phone) → Firebase sends OTP SMS
     *  2. confirmationResult.confirm(otp) → Firebase returns UserCredential
     *  3. userCredential.user.getIdToken() → Firebase ID token
     *  4. POST /auth/firebase-verify { idToken } → this method → our JWT
     */
    async verifyFirebaseToken(idToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: any;
    }> {
        // 1. Verify the Firebase ID token
        const decoded = await this.firebaseAdminService.verifyIdToken(idToken);
        const phoneNumber = decoded.phone_number;

        if (!phoneNumber) {
            throw new UnauthorizedException('Firebase token does not contain a phone number');
        }

        this.logger.log(`[FirebaseAuth] Verified phone: ${phoneNumber}`);

        // 2. Find or create user in MongoDB
        let user = await this.usersService.findByPhoneNumber(phoneNumber);
        if (!user) {
            this.logger.log(`[FirebaseAuth] Creating new user for ${phoneNumber}`);
            user = await this.usersService.create(phoneNumber);
        } else {
            this.logger.log(`[FirebaseAuth] Found existing user: ${user._id}`);
        }

        // 3. Mark as verified and update last login
        await this.usersService.markAsVerified(user._id.toString());

        // 4. Issue our JWT tokens
        const tokens = await this.generateTokens(user._id.toString(), phoneNumber);

        // 5. Store hashed refresh token
        const hashedRefreshToken = hashValue(tokens.refreshToken);
        await this.usersService.updateRefreshToken(user._id.toString(), hashedRefreshToken);

        return {
            ...tokens,
            user: {
                id: user._id,
                phoneNumber: user.phoneNumber,
                isVerified: true,
            },
        };
    }

    /**
     * Refresh access + refresh tokens using a valid refresh token.
     */
    async refreshTokens(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }> {
        try {
            const payload = await this.jwtService.verifyAsync(refreshToken, {
                secret: this.configService.get<string>('jwt.refreshSecret') || 'default-refresh-secret',
            });

            const user = await this.usersService.findById(payload.sub);
            if (!user || !user.refreshToken) {
                throw new UnauthorizedException('Invalid refresh token');
            }

            const hashedProvided = hashValue(refreshToken);
            if (user.refreshToken !== hashedProvided) {
                throw new UnauthorizedException('Invalid refresh token');
            }

            const tokens = await this.generateTokens(user._id.toString(), user.phoneNumber);
            const hashedNew = hashValue(tokens.refreshToken);
            await this.usersService.updateRefreshToken(user._id.toString(), hashedNew);

            return tokens;
        } catch {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }

    private async generateTokens(
        userId: string,
        phoneNumber: string,
    ): Promise<{ accessToken: string; refreshToken: string }> {
        const payload = { sub: userId, phoneNumber };

        const accessToken = await this.jwtService.signAsync(payload, {
            secret: this.configService.get<string>('jwt.accessSecret') || 'default-secret',
            expiresIn: this.configService.get<string>('jwt.accessExpiry') || '15m',
        } as any);

        const refreshToken = await this.jwtService.signAsync(payload, {
            secret: this.configService.get<string>('jwt.refreshSecret') || 'default-refresh-secret',
            expiresIn: this.configService.get<string>('jwt.refreshExpiry') || '7d',
        } as any);

        return { accessToken, refreshToken };
    }
}
