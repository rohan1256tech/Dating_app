import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export class SendMessageDto {
    @IsNotEmpty()
    @IsMongoId()
    matchId: string;

    @IsNotEmpty()
    @IsString()
    content: string;
}
