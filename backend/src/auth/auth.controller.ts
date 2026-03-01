import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('request-otp')
    @HttpCode(HttpStatus.OK)
    async requestOTP(@Body() requestOtpDto: RequestOtpDto) {
        return this.authService.requestOTP(requestOtpDto);
    }

    @Post('verify-otp')
    @HttpCode(HttpStatus.OK)
    async verifyOTP(@Body() verifyOtpDto: VerifyOtpDto) {
        return this.authService.verifyOTP(verifyOtpDto);
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refresh(@Body('refreshToken') refreshToken: string) {
        return this.authService.refreshTokens(refreshToken);
    }
}
