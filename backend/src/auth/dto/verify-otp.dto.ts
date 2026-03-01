import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class VerifyOtpDto {
    @IsString()
    @IsNotEmpty({ message: 'Phone number is required' })
    @Matches(/^\+[1-9]\d{1,14}$/, {
        message: 'Invalid phone number format. Use international format (e.g., +919876543210)',
    })
    phoneNumber: string;

    @IsString()
    @IsNotEmpty({ message: 'OTP is required' })
    @Length(6, 6, { message: 'OTP must be 6 digits' })
    @Matches(/^\d{6}$/, { message: 'OTP must contain only digits' })
    otp: string;
}
