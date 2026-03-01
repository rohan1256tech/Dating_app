import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class RequestOtpDto {
    @IsString()
    @IsNotEmpty({ message: 'Phone number is required' })
    @Matches(/^\+[1-9]\d{1,14}$/, {
        message: 'Invalid phone number format. Use international format (e.g., +919876543210)',
    })
    phoneNumber: string;
}
