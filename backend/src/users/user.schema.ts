import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

// ─── Nested schemas ──────────────────────────────────────────────────────────

@Schema({ _id: false })
class Subscription {
    @Prop({ type: String, enum: ['FREE', 'PREMIUM'], default: 'FREE' })
    plan: string;

    @Prop({ type: Date })
    expiresAt?: Date;
}

@Schema({ _id: false })
class SwipeStats {
    @Prop({ type: Number, default: 0 })
    swipesToday: number;

    @Prop({ type: Date })
    lastResetAt?: Date;
}

@Schema({ _id: false })
class Boost {
    @Prop({ type: Boolean, default: false })
    isActive: boolean;

    @Prop({ type: Date })
    expiresAt?: Date;
}

// ─── Main User schema ─────────────────────────────────────────────────────────

@Schema({
    timestamps: true,
    collection: 'users',
})
export class User {
    @Prop({ required: true, unique: true })
    phoneNumber: string;

    @Prop({ default: false })
    isVerified: boolean;

    @Prop()
    lastLoginAt: Date;

    @Prop()
    refreshToken: string;

    @Prop({ type: Subscription, default: () => ({ plan: 'FREE' }) })
    subscription: Subscription;

    @Prop({ type: SwipeStats, default: () => ({ swipesToday: 0 }) })
    swipeStats: SwipeStats;

    @Prop({ type: Boost, default: () => ({ isActive: false }) })
    boost: Boost;

    createdAt: Date;
    updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
