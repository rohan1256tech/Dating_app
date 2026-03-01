import { IsBoolean, IsNumber, IsOptional } from 'class-validator';

export class UpdateMapLocationDto {
    @IsNumber()
    latitude: number;

    @IsNumber()
    longitude: number;

    @IsBoolean()
    @IsOptional()
    showOnMap?: boolean;
}
