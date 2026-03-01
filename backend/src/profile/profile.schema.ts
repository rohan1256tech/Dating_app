import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ProfileDocument = Profile & Document;

@Schema({ timestamps: true })
export class Profile {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true })
    userId: MongooseSchema.Types.ObjectId;

    @Prop({ required: true, minlength: 2 })
    name: string;

    @Prop({ required: true })
    dob: Date;

    @Prop({ min: 18 })
    age: number;

    @Prop({ required: true, enum: ['Male', 'Female', 'Other'] })
    gender: string;

    @Prop({ type: [String], default: [] })
    interests: string[];

    @Prop({ enum: ['Men', 'Women', 'Everyone'], required: false })
    lookingFor?: string;

    @Prop({ type: [String], default: [] })
    photos: string[];

    @Prop()
    bio?: string;

    // GeoJSON Point for geospatial queries.
    // Using Mixed type to prevent Mongoose from auto-initializing
    // coordinates as [] which breaks the 2dsphere index.
    @Prop({ type: MongooseSchema.Types.Mixed })
    location?: {
        type: 'Point';
        coordinates: [number, number]; // [longitude, latitude]
    };

    // Legacy format for backward compatibility
    @Prop({ type: Object })
    legacyLocation?: {
        latitude: number;
        longitude: number;
        city?: string;
    };

    // Map visibility control (Ghost Mode)
    @Prop({ default: false })
    showOnMap?: boolean;

    // Last time location was updated on map
    @Prop()
    lastMapLocationUpdate?: Date;

    @Prop({ default: false })
    profileCompleted: boolean;

    createdAt?: Date;
    updatedAt?: Date;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);

// Sparse 2dsphere index: documents without a location field are ignored entirely,
// so corrupt/missing location never causes a geo key extraction error.
ProfileSchema.index({ location: '2dsphere' }, { sparse: true });

// Middleware to auto-calculate age from dob and check profile completion
ProfileSchema.pre('save', function () {
    // Calculate age from dob
    if (this.dob) {
        const today = new Date();
        const birthDate = new Date(this.dob);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        this.age = age;
    }

    // Check if profile is complete
    this.profileCompleted = !!(
        this.name &&
        this.dob &&
        this.age >= 18 &&
        this.gender &&
        this.lookingFor &&
        this.interests && this.interests.length >= 3 &&
        this.photos && this.photos.length >= 1 &&
        (
            (this.location && this.location.coordinates && this.location.coordinates.length === 2) ||
            (this.legacyLocation && this.legacyLocation.latitude !== undefined && this.legacyLocation.longitude !== undefined)
        )
    );
});
