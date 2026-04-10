import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { v2 as cloudinary } from 'cloudinary';
import { Model, Types } from 'mongoose';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Profile, ProfileDocument } from './profile.schema';

@Injectable()
export class ProfileService {
    private readonly logger = new Logger(ProfileService.name);

    constructor(
        @InjectModel(Profile.name) private profileModel: Model<ProfileDocument>,
        private configService: ConfigService,
    ) {
        // Configure Cloudinary
        cloudinary.config({
            cloud_name: this.configService.get<string>('cloudinary.cloudName'),
            api_key: this.configService.get<string>('cloudinary.apiKey'),
            api_secret: this.configService.get<string>('cloudinary.apiSecret'),
        });
    }

    /**
     * Find profile by userId
     * Returns profile or default incomplete status
     */
    async findByUserId(userId: string): Promise<Partial<Profile>> {
        this.logger.log(`Debugging Profile Lookup: Searching for userId ${userId}`);
        const objectId = new Types.ObjectId(userId);
        const profile = await this.profileModel.findOne({ userId: objectId } as any).exec();

        if (!profile) {
            this.logger.warn(`Profile Lookup Failed: No profile found for userId ${userId}`);
            return {
                profileCompleted: false,
            };
        }

        this.logger.log(`Profile Lookup Success: Found profile for userId ${userId}`);
        return profile.toObject();
    }

    /**
     * Create or update profile (upsert)
     * Supports partial updates for wizard-style flow
     */
    async createOrUpdate(
        userId: string,
        data: CreateProfileDto | UpdateProfileDto,
    ): Promise<Profile> {
        // Build clean update data, excluding location initially
        const updateData: any = {};
        Object.keys(data).forEach(key => {
            if (key !== 'location') {
                updateData[key] = (data as any)[key];
            }
        });

        // Convert DOB string to Date if provided
        if (updateData.dob) {
            updateData.dob = new Date(updateData.dob);
        }

        // Handle location data properly - only add if valid
        if (data.location) {
            const locationData = data.location as any;

            // Check if it's legacy format with latitude/longitude
            if (locationData.latitude !== undefined && locationData.longitude !== undefined) {
                const { latitude, longitude, city } = locationData;
                updateData.location = {
                    type: 'Point',
                    coordinates: [longitude, latitude], // GeoJSON is [lng, lat]
                };
                updateData.legacyLocation = { latitude, longitude, city };
                this.logger.log('Converted legacy location to GeoJSON');
            } else if (locationData.coordinates && Array.isArray(locationData.coordinates) && locationData.coordinates.length === 2) {
                // Already in GeoJSON format with valid coordinates
                updateData.location = {
                    type: 'Point',
                    coordinates: locationData.coordinates,
                };
                this.logger.log('Using provided GeoJSON location');
            } else {
                // Invalid or incomplete location data - skip it completely
                this.logger.warn('Invalid location data received (no valid coordinates), skipping location update');
                // Do NOT add location to updateData
            }
        }

        // Remove undefined fields to prevent overwriting existing data with undefined
        Object.keys(updateData).forEach(
            (key) => updateData[key] === undefined && delete updateData[key],
        );

        // Calculate age if dob is provided
        if (updateData.dob) {
            const dob = new Date(updateData.dob);
            const today = new Date();
            let age = today.getFullYear() - dob.getFullYear();
            const m = today.getMonth() - dob.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
            updateData.age = age;
        }

        const objectId = new Types.ObjectId(userId);

        // Step 1: Clean up any corrupt location (coordinates: []) AND apply the update
        // in a single updateOne call. updateOne with $set does NOT trigger 2dsphere
        // index validation on the whole document — only findOneAndUpdate does.
        // We combine $set (new data) with $unset (corrupt location) in one atomic op.
        const setOp: any = { ...updateData };
        const unsetOp: any = {};

        // If we're NOT setting a new valid location, check if existing location is corrupt
        // and unset it. We do this unconditionally to handle existing corrupt docs.
        if (!updateData.location) {
            // We'll conditionally unset only if coordinates is empty — handled via
            // a separate targeted updateOne that only matches corrupt docs.
            await (this.profileModel as any).updateOne(
                {
                    userId: objectId,
                    $or: [
                        { 'location.coordinates': { $size: 0 } },
                        { 'location.coordinates': { $exists: false }, 'location.type': { $exists: false }, location: { $exists: true } },
                    ]
                },
                { $unset: { location: '' } }
            ).exec();
        }

        // Step 2: Upsert the profile data using updateOne (safe — no geo index check)
        await (this.profileModel as any).updateOne(
            { userId: objectId },
            { $set: setOp },
            { upsert: true }
        ).exec();

        // Step 3: Fetch the updated document
        const updatedProfile = await (this.profileModel as any).findOne({ userId: objectId }).exec();

        if (!updatedProfile) {
            throw new Error('Failed to create or update profile');
        }

        // Recalculate profileCompleted based on the full merged document
        const p = updatedProfile;
        // NOTE: Location is NOT required for profile completion.
        // Location is only collected contexually when the user opens the Nearby tab,
        // per Play Store contextual permission policy.
        const isComplete = !!(
            p.name && p.dob && p.age >= 18 && p.gender && p.lookingFor &&
            p.interests && p.interests.length >= 3 &&
            p.photos && p.photos.length >= 1
        );

        if (p.profileCompleted !== isComplete) {
            await (this.profileModel as any).updateOne(
                { userId: objectId },
                { $set: { profileCompleted: isComplete } }
            ).exec();
            updatedProfile.profileCompleted = isComplete;
        }

        this.logger.log(`Profile ${isComplete ? 'completed' : 'incomplete'} for user ${userId}`);
        return updatedProfile.toObject();
    }

    /**
     * Upload photo to Cloudinary
     * Returns public URL
     */
    async uploadPhoto(file: Express.Multer.File): Promise<string> {
        try {
            this.logger.log(`Uploading photo: ${file.originalname}`);

            // Upload to Cloudinary
            const result = await new Promise<any>((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: 'dating-app/profiles',
                        resource_type: 'image',
                        transformation: [
                            { width: 1080, height: 1350, crop: 'fill' }, // Portrait aspect ratio
                            { quality: 'auto:good' },
                            { fetch_format: 'auto' }, // Auto-select best format (WebP, etc.)
                        ],
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    },
                );

                uploadStream.end(file.buffer);
            });

            this.logger.log(`Photo uploaded successfully: ${result.secure_url}`);
            return result.secure_url;
        } catch (error: any) {
            this.logger.error(`Failed to upload photo: ${error.message}`);
            throw error;
        }
    }

    /**
     * Add photo URL to user's profile
     */
    async addPhotoToProfile(userId: string, photoUrl: string): Promise<Profile> {
        const objectId = new Types.ObjectId(userId);
        const profile = await this.profileModel.findOne({ userId: objectId } as any).exec();

        if (!profile) {
            throw new NotFoundException('Profile not found');
        }

        // Add photo URL to photos array
        if (!profile.photos) {
            profile.photos = [];
        }
        profile.photos.push(photoUrl);

        await profile.save();

        this.logger.log(`Added photo to profile for user ${userId}. Total photos: ${profile.photos.length}`);

        return profile.toObject();
    }

    /**
     * Remove photo from profile
     */
    async removePhotoFromProfile(userId: string, photoUrl: string): Promise<Profile> {
        const objectId = new Types.ObjectId(userId);
        const profile = await this.profileModel.findOne({ userId: objectId } as any).exec();

        if (!profile) {
            throw new NotFoundException('Profile not found');
        }

        // Remove photo URL from array
        profile.photos = profile.photos.filter((url) => url !== photoUrl);

        await profile.save();

        this.logger.log(`Removed photo from profile for user ${userId}`);

        return profile.toObject();
    }
}
