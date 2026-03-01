import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type SwipeDocument = Swipe & Document;

@Schema({ timestamps: true })
export class Swipe {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
    swiperId: MongooseSchema.Types.ObjectId;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
    targetId: MongooseSchema.Types.ObjectId;

    @Prop({ required: true, enum: ['LIKE', 'PASS', 'SUPERLIKE'] })
    action: string;

    @Prop({ default: Date.now })
    createdAt: Date;
}

export const SwipeSchema = SchemaFactory.createForClass(Swipe);
// Compound index to prevent duplicate swipes
SwipeSchema.index({ swiperId: 1, targetId: 1 }, { unique: true });
