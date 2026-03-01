import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Match, MatchDocument } from '../discovery/schemas/match.schema';
import { Profile, ProfileDocument } from '../profile/profile.schema';

@Injectable()
export class MatchService {
    private readonly logger = new Logger(MatchService.name);

    constructor(
        @InjectModel(Match.name) private matchModel: Model<MatchDocument>,
        @InjectModel(Profile.name) private profileModel: Model<ProfileDocument>,
    ) { }

    /**
     * Get all active matches for a user with populated profile data
     */
    async getUserMatches(userId: string) {
        this.logger.log(`Fetching matches for user: ${userId}`);
        const userObjectId = new Types.ObjectId(userId);

        // Find all active matches where user is either user1 or user2
        const matches = await this.matchModel
            .find({
                $or: [
                    { user1Id: userObjectId },
                    { user2Id: userObjectId },
                ],
                isActive: true,
            } as any)
            .sort({ lastMessageAt: -1, createdAt: -1 })
            .exec();

        this.logger.log(`Found ${matches.length} active matches`);

        // Get all other user IDs in one batch to avoid N+1 queries
        const otherUserIds = matches.map((match) =>
            match.user1Id.toString() === userId ? match.user2Id : match.user1Id
        );

        // Fetch all profiles in a single query
        const profiles = await this.profileModel
            .find({ userId: { $in: otherUserIds } } as any)
            .exec();

        // Create a map for O(1) lookup
        const profileMap = new Map();
        profiles.forEach((profile) => {
            profileMap.set(profile.userId.toString(), profile);
        });

        // Map matches with their corresponding profiles
        const matchesWithProfiles = matches.map((match) => {
            const otherUserId = match.user1Id.toString() === userId
                ? match.user2Id.toString()
                : match.user1Id.toString();

            const profile = profileMap.get(otherUserId);

            return {
                matchId: match._id.toString(),
                userId: otherUserId,
                profile: profile ? {
                    name: profile.name,
                    age: profile.age,
                    photos: profile.photos,
                    bio: profile.bio,
                    interests: profile.interests,
                } : null,
                lastMessage: match.lastMessage,
                lastMessageAt: match.lastMessageAt,
                createdAt: match.createdAt,
            };
        });

        return matchesWithProfiles;
    }

    /**
     * Soft delete a match
     */
    async deleteMatch(userId: string, matchId: string) {
        this.logger.log(`User ${userId} deleting match ${matchId}`);
        const userObjectId = new Types.ObjectId(userId);
        const matchObjectId = new Types.ObjectId(matchId);

        const match = await this.matchModel.findById(matchObjectId).exec();

        if (!match) {
            throw new NotFoundException('Match not found');
        }

        // Verify user belongs to this match
        if (
            match.user1Id.toString() !== userId &&
            match.user2Id.toString() !== userId
        ) {
            throw new ForbiddenException('You do not have access to this match');
        }

        // Soft delete
        match.isActive = false;
        await match.save();

        this.logger.log(`Match ${matchId} soft deleted`);
        return { message: 'Match deleted successfully' };
    }

    /**
     * Check if a match exists and is active between two users
     */
    async findActiveMatch(user1Id: string, user2Id: string): Promise<MatchDocument | null> {
        const ids = [new Types.ObjectId(user1Id), new Types.ObjectId(user2Id)].sort((a, b) =>
            a.toString().localeCompare(b.toString())
        );

        return this.matchModel.findOne({
            user1Id: ids[0],
            user2Id: ids[1],
            isActive: true,
        } as any).exec();
    }

    /**
     * Update match's last message info
     */
    async updateLastMessage(matchId: string, content: string, timestamp: Date) {
        await this.matchModel.findByIdAndUpdate(matchId, {
            lastMessage: content,
            lastMessageAt: timestamp,
        } as any).exec();
    }
}
