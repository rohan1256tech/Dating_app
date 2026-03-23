import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type MessageDocument = Message & Document;

export enum MessageStatus {
    SENT = 'sent',
    DELIVERED = 'delivered',
    READ = 'read',
}

@Schema({ timestamps: true })
export class Message {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Match', required: true, index: true })
    matchId: MongooseSchema.Types.ObjectId;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    senderId: MongooseSchema.Types.ObjectId;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    receiverId: MongooseSchema.Types.ObjectId;

    @Prop({ required: true })
    content: string;

    @Prop({ default: false })
    read: boolean;

    @Prop({ type: String, enum: MessageStatus, default: MessageStatus.SENT })
    status: MessageStatus;

    @Prop({ type: Date, default: null })
    deliveredAt: Date | null;

    @Prop({ type: Date, default: null })
    readAt: Date | null;

    createdAt?: Date;
    updatedAt?: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Indexes for efficient queries
MessageSchema.index({ matchId: 1, createdAt: -1 }); // For fetching conversation history
MessageSchema.index({ receiverId: 1, read: 1 }); // For unread count queries
MessageSchema.index({ receiverId: 1, status: 1 }); // For delivery receipt queries

