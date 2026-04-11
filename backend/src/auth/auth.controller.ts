import { Body, Controller, Delete, HttpCode, HttpStatus, Post, Request, UseGuards } from '@nestjs/common';
import { IsString } from 'class-validator';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

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
     * DELETE /auth/account
     * Permanently deletes the authenticated user's account and all their data.
     * Required by Google Play Store policy (Aug 2023).
     */
    @Delete('account')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async deleteAccount(@Request() req: any) {
        // JwtStrategy.validate() returns { userId, phoneNumber } — NOT { sub }
        const userId: string = req.user.userId;
        const phoneNumber: string = req.user.phoneNumber;
        await this.authService.deleteAccount(userId, phoneNumber);
        return { message: 'Account deleted successfully' };
    }
}
