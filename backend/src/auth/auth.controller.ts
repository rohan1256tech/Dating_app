import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { IsString } from 'class-validator';
import { AuthService } from './auth.service';

class FirebaseVerifyDto {
    @IsString()
    idToken: string;
}

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    /**
     * POST /auth/firebase-verify
     * Called by the app after Firebase confirms the phone OTP.
     * Accepts the Firebase ID token, verifies it, finds/creates user, issues JWT.
     */
    @Post('firebase-verify')
    @HttpCode(HttpStatus.OK)
    async firebaseVerify(@Body() body: FirebaseVerifyDto) {
        return this.authService.verifyFirebaseToken(body.idToken);
    }

    /**
     * POST /auth/refresh
     * Refresh access token using stored refresh token.
     */
    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refresh(@Body('refreshToken') refreshToken: string) {
        return this.authService.refreshTokens(refreshToken);
    }

    /**
     * POST /auth/dev-send-otp
     * For Expo Go development only. Bypasses Firebase.
     */
    @Post('dev-send-otp')
    @HttpCode(HttpStatus.OK)
    async devSendOtp(@Body('phone') phone: string) {
        return this.authService.devSendOtp(phone);
    }

    /**
     * POST /auth/dev-verify-otp
     * For Expo Go development only. Bypasses Firebase.
     */
    @Post('dev-verify-otp')
    @HttpCode(HttpStatus.OK)
    async devVerifyOtp(@Body('phone') phone: string, @Body('code') code: string) {
        return this.authService.devVerifyOtp(phone, code);
    }
}
