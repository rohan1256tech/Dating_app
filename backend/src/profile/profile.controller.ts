import {
    Body,
    Controller,
    Get,
    Patch,
    Post,
    Req,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';

@Controller('profile')
@UseGuards(JwtAuthGuard) // All routes require authentication
export class ProfileController {
    constructor(private readonly profileService: ProfileService) { }

    /**
     * GET /profile/me
     * Get current user's profile
     */
    @Get('me')
    async getMyProfile(@Req() req: any) {
        const userId = req.user.userId;
        const profile = await this.profileService.findByUserId(userId);
        return profile;
    }

    /**
     * POST /profile/create-or-update
     * Create or update profile with partial data
     */
    @Post('create-or-update')
    async createOrUpdateProfile(@Req() req: any, @Body() data: CreateProfileDto) {
        const userId = req.user.userId;
        const profile = await this.profileService.createOrUpdate(userId, data);
        return {
            message: 'Profile updated successfully',
            profile,
        };
    }

    /**
     * PATCH /profile/update
     * Alias for create-or-update (partial update)
     */
    @Patch('update')
    async updateProfile(@Req() req: any, @Body() data: UpdateProfileDto) {
        const userId = req.user.userId;
        const profile = await this.profileService.createOrUpdate(userId, data);
        return {
            message: 'Profile updated successfully',
            profile,
        };
    }

    /**
     * POST /profile/upload-photo
     * Upload a single photo to Cloudinary
     * Automatically adds to user's profile
     */
    @Post('upload-photo')
    @UseInterceptors(FileInterceptor('photo'))
    async uploadPhoto(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
        if (!file) {
            return {
                success: false,
                message: 'No file uploaded',
            };
        }

        const userId = req.user.userId;

        // Upload to Cloudinary
        const photoUrl = await this.profileService.uploadPhoto(file);

        // Add to profile
        const profile = await this.profileService.addPhotoToProfile(userId, photoUrl);

        return {
            success: true,
            message: 'Photo uploaded successfully',
            photoUrl,
            profile,
        };
    }
}
