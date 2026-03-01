import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Match, MatchDocument } from '../discovery/schemas/match.schema';
import { SendMessageDto } from './dto/send-message.dto';
import { Message, MessageDocument } from './message.schema';

@Injectable()
export class MessageService {
    private readonly logger = new Logger(MessageService.name);

    constructor(
        @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
        @InjectModel(Match.name) private matchModel: Model<MatchDocument>,
    ) { }

    /**
     * Get paginated messages for a match
     */
    async getMessages(userId: string, matchId: string, page: number = 1, limit: number = 50) {
        this.logger.log(`Fetching messages for match ${matchId}, page ${page}`);

        const matchObjectId = new Types.ObjectId(matchId);
        const userObjectId = new Types.ObjectId(userId);

        // Verify match exists and user belongs to it
        const match = await this.matchModel.findById(matchObjectId).exec();
        if (!match) {
            throw new NotFoundException('Match not found');
        }

        if (
            match.user1Id.toString() !== userId &&
            match.user2Id.toString() !== userId
        ) {
            throw new ForbiddenException('You do not have access to this match');
        }

        if (!match.isActive) {
            throw new BadRequestException('This match is no longer active');
        }

        // Fetch messages with pagination
        const skip = (page - 1) * limit;
        const messages = await this.messageModel
            .find({ matchId: matchObjectId } as any)
            .sort({ createdAt: 1 }) // Oldest first
            .skip(skip)
            .limit(limit)
            .exec();

        const total = await this.messageModel.countDocuments({ matchId: matchObjectId } as any);

        return {
            messages: messages.map(msg => ({
                id: msg._id.toString(),
                matchId: msg.matchId.toString(),
                senderId: msg.senderId.toString(),
                receiverId: msg.receiverId.toString(),
                content: msg.content,
                read: msg.read,
                createdAt: msg.createdAt,
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Send a new message
     */
    async sendMessage(userId: string, sendMessageDto: SendMessageDto) {
        const { matchId, content } = sendMessageDto;
        this.logger.log(`User ${userId} sending message to match ${matchId}`);

        const matchObjectId = new Types.ObjectId(matchId);
        const senderObjectId = new Types.ObjectId(userId);

        // Verify match exists and is active
        const match = await this.matchModel.findById(matchObjectId).exec();
        if (!match) {
            throw new NotFoundException('Match not found');
        }

        if (!match.isActive) {
            throw new BadRequestException('Cannot send message to inactive match');
        }

        // Verify sender belongs to match
        if (
            match.user1Id.toString() !== userId &&
            match.user2Id.toString() !== userId
        ) {
            throw new ForbiddenException('You do not belong to this match');
        }

        // Determine receiver
        const receiverObjectId = match.user1Id.toString() === userId
            ? match.user2Id
            : match.user1Id;

        // Create message
        const message = await this.messageModel.create({
            matchId: matchObjectId,
            senderId: senderObjectId,
            receiverId: receiverObjectId,
            content,
            read: false,
        } as any);

        // Update match's last message info
        const now = new Date();
        await this.matchModel.findByIdAndUpdate(matchObjectId, {
            lastMessage: content,
            lastMessageAt: now,
        } as any).exec();

        this.logger.log(`Message sent successfully: ${message._id}`);

        return {
            id: message._id.toString(),
            matchId: message.matchId.toString(),
            senderId: message.senderId.toString(),
            receiverId: message.receiverId.toString(),
            content: message.content,
            read: message.read,
            createdAt: message.createdAt,
        };
    }

    /**
     * Mark all messages in a match as read for the current user
     */
    async markMessagesAsRead(userId: string, matchId: string) {
        this.logger.log(`Marking messages as read for user ${userId} in match ${matchId}`);

        const matchObjectId = new Types.ObjectId(matchId);
        const userObjectId = new Types.ObjectId(userId);

        // Verify match exists and user belongs to it
        const match = await this.matchModel.findById(matchObjectId).exec();
        if (!match) {
            throw new NotFoundException('Match not found');
        }

        if (
            match.user1Id.toString() !== userId &&
            match.user2Id.toString() !== userId
        ) {
            throw new ForbiddenException('You do not have access to this match');
        }

        // Mark all unread messages where user is receiver as read
        const result = await this.messageModel.updateMany(
            {
                matchId: matchObjectId,
                receiverId: userObjectId,
                read: false,
            } as any,
            { read: true } as any
        ).exec();

        this.logger.log(`Marked ${result.modifiedCount} messages as read`);

        return {
            markedCount: result.modifiedCount,
        };
    }

    /**
     * Get unread message count for a user
     */
    async getUnreadCount(userId: string) {
        const userObjectId = new Types.ObjectId(userId);
        const count = await this.messageModel.countDocuments({
            receiverId: userObjectId,
            read: false,
        } as any);

        return { unreadCount: count };
    }
}
