import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Swipe, SwipeDocument } from '../discovery/schemas/swipe.schema';
import { Profile, ProfileDocument } from '../profile/profile.schema';
import { SubscriptionService } from '../subscription/subscription.service';

@Controller('likes')
@UseGuards(JwtAuthGuard)
export class LikesController {
    constructor(
        @InjectModel(Swipe.name) private swipeModel: Model<SwipeDocument>,
        @InjectModel(Profile.name) private profileModel: Model<ProfileDocument>,
        private readonly subscriptionService: SubscriptionService,
    ) { }

    /**
     * GET /likes/received
     * Returns users who liked (LIKE or SUPERLIKE) the current user.
     * FREE  → blurred placeholder data
     * PREMIUM → full profile data
     */
    @Get('received')
    async getLikesReceived(@Req() req: any) {
        const userId = req.user.userId;
        const userObjectId = new Types.ObjectId(userId);

        const premium = await this.subscriptionService.isPremium(userId);

        // Find all swipes where someone liked us
        const likeDocs = await this.swipeModel
            .find({
                targetId: userObjectId,
                action: { $in: ['LIKE', 'SUPERLIKE'] },
            } as any)
            .select('swiperId action createdAt')
            .sort({ createdAt: -1 })
            .limit(100)
            .exec();

        const likerIds = likeDocs.map(doc => doc.swiperId);

        // Fetch profiles
        const profiles = await this.profileModel
            .find({ userId: { $in: likerIds } } as any)
            .select('userId name age photos bio interests gender')
            .exec();

        const profileMap = new Map(
            profiles.map(p => [p.userId.toString(), p]),
        );

        const result = likeDocs.map(doc => {
            const swiperId = doc.swiperId.toString();
            const profile = profileMap.get(swiperId);

            if (!profile) return null;

            if (premium) {
                // Full data for PREMIUM users
                return {
                    userId: swiperId,
                    name: profile.name,
                    age: profile.age,
                    photo: profile.photos?.[0] ?? null,
                    photos: profile.photos ?? [],
                    bio: profile.bio ?? '',
                    interests: profile.interests ?? [],
                    gender: profile.gender,
                    action: doc.action,
                    likedAt: doc.createdAt,
                    blurred: false,
                };
            } else {
                // Blurred data for FREE users
                return {
                    userId: swiperId,
                    name: profile.name ? profile.name[0] + '•••' : 'Someone',
                    age: profile.age,
                    photo: null, // No real photo
                    blurredPhoto: 'BLURRED',
                    blurred: true,
                    action: doc.action,
                    likedAt: doc.createdAt,
                };
            }
        }).filter(Boolean);

        return {
            isPremium: premium,
            count: result.length,
            likes: result,
        };
    }
}
