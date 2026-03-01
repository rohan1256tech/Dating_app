import {
    Injectable,
    Logger,
    UnauthorizedException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { hashValue } from '../common/utils/crypto.util';
import { OtpService } from '../otp/otp.service';
import { UsersService } from '../users/users.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private usersService: UsersService,
        private otpService: OtpService,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    /**
     * Request OTP for phone number
     */
    async requestOTP(requestOtpDto: RequestOtpDto): Promise<{ message: string; otp?: string }> {
        const { phoneNumber } = requestOtpDto;

        // Generate and store OTP
        const otp = await this.otpService.generateAndStoreOTP(phoneNumber);

        // Increment rate limit counter
        await this.otpService.incrementRateLimit(phoneNumber);

        // Send OTP via SMS (real SMS in production; console.log in dev)
        await this.otpService.sendOTP(phoneNumber, otp);

        this.logger.log(`OTP requested for ${phoneNumber}`);
        this.logger.log(`🔑 DEV OTP for ${phoneNumber}: ${otp}`);

        const isDev = this.configService.get<string>('NODE_ENV', 'development') !== 'production';

        return {
            message: 'OTP sent successfully',
            // ⚠️  Only exposed in development — never in production
            ...(isDev ? { otp } : {}),
        };
    }

    /**
     * Verify OTP and return JWT tokens
     */
    async verifyOTP(verifyOtpDto: VerifyOtpDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: any;
    }> {
        const { phoneNumber, otp } = verifyOtpDto;

        // Verify OTP
        const isValid = await this.otpService.verifyOTP(phoneNumber, otp);

        if (!isValid) {
            throw new UnauthorizedException('Invalid or expired OTP');
        }

        // Find or create user
        this.logger.log(`Verifying user with phone: ${phoneNumber}`);
        let user = await this.usersService.findByPhoneNumber(phoneNumber);

        if (!user) {
            this.logger.log(`User not found, creating new user for ${phoneNumber}`);
            user = await this.usersService.create(phoneNumber);
        } else {
            this.logger.log(`Found existing user: ${user._id}`);
        }

        // Mark user as verified and update last login
        await this.usersService.markAsVerified(user._id.toString());

        // Generate JWT tokens
        const tokens = await this.generateTokens(user._id.toString(), phoneNumber);

        // Store refresh token (hashed)
        const hashedRefreshToken = hashValue(tokens.refreshToken);
        await this.usersService.updateRefreshToken(
            user._id.toString(),
            hashedRefreshToken,
        );

        this.logger.log(`User ${phoneNumber} verified and logged in`);

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
     * Generate access and refresh tokens
     */
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

        return {
            accessToken,
            refreshToken,
        };
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshTokens(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }> {
        try {
            const payload = await this.jwtService.verifyAsync(refreshToken, {
                secret: this.configService.get<string>('jwt.refreshSecret') || 'default-refresh-secret',
            });

            // Find user and verify stored refresh token
            const user = await this.usersService.findById(payload.sub);

            if (!user || !user.refreshToken) {
                throw new UnauthorizedException('Invalid refresh token');
            }

            const hashedProvidedToken = hashValue(refreshToken);

            if (user.refreshToken !== hashedProvidedToken) {
                throw new UnauthorizedException('Invalid refresh token');
            }

            // Generate new tokens
            const tokens = await this.generateTokens(
                user._id.toString(),
                user.phoneNumber,
            );

            // Update stored refresh token
            const hashedNewRefreshToken = hashValue(tokens.refreshToken);
            await this.usersService.updateRefreshToken(
                user._id.toString(),
                hashedNewRefreshToken,
            );

            return tokens;
        } catch (error) {
            throw new UnauthorizedException('Invalid refresh token');
        }
    }
}
