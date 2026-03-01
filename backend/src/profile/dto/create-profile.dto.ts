import { Type } from 'class-transformer';
import {
    ArrayMaxSize,
    ArrayMinSize,
    IsArray,
    IsDateString,
    IsEnum,
    IsLatitude,
    IsLongitude,
    IsOptional,
    IsString,
    MinLength,
    ValidateNested
} from 'class-validator';

class LocationDto {
    @IsLatitude()
    latitude: number;

    @IsLongitude()
    longitude: number;

    @IsOptional()
    @IsString()
    city?: string;
}

export class CreateProfileDto {
    @IsOptional()
    @IsString()
    @MinLength(2, { message: 'Name must be at least 2 characters long' })
    name?: string;

    @IsOptional()
    @IsDateString({}, { message: 'Date of birth must be a valid ISO date string' })
    dob?: string;

    @IsOptional()
    @IsEnum(['Male', 'Female', 'Other'], { message: 'Gender must be Male, Female, or Other' })
    gender?: string;

    @IsOptional()
    @IsArray()
    @ArrayMinSize(3, { message: 'At least 3 interests are required' })
    @ArrayMaxSize(5, { message: 'Maximum 5 interests allowed' })
    @IsString({ each: true })
    interests?: string[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    photos?: string[];

    @IsOptional()
    @IsString()
    bio?: string;

    @IsOptional()
    @IsEnum(['Men', 'Women', 'Everyone'], { message: 'lookingFor must be Men, Women, or Everyone' })
    lookingFor?: string;

    @IsOptional()
    @ValidateNested()
    @Type(() => LocationDto)
    location?: LocationDto;
}
