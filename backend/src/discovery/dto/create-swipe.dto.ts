import { IsEnum, IsMongoId, IsNotEmpty } from 'class-validator';

export class CreateSwipeDto {
    @IsNotEmpty()
    @IsMongoId()
    targetId: string;

    @IsNotEmpty()
    @IsEnum(['LIKE', 'PASS', 'SUPERLIKE'])
    action: string;
}
