import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type MatchDocument = Match & Document;

@Schema({ timestamps: true })
export class Match {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
    user1Id: MongooseSchema.Types.ObjectId;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
    user2Id: MongooseSchema.Types.ObjectId;

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ type: Date })
    lastMessageAt?: Date;

    @Prop()
    lastMessage?: string;

    createdAt?: Date;
    updatedAt?: Date;
}

export const MatchSchema = SchemaFactory.createForClass(Match);
// Ensure unique match between two users
MatchSchema.index({ user1Id: 1, user2Id: 1 }, { unique: true });
// Index for querying active matches sorted by recent activity
MatchSchema.index({ user1Id: 1, isActive: 1, lastMessageAt: -1 });
MatchSchema.index({ user2Id: 1, isActive: 1, lastMessageAt: -1 });
