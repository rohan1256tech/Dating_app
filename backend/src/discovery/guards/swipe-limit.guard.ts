import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
    Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../users/user.schema';

const FREE_SWIPE_LIMIT = 5;

/** Returns midnight UTC of today */
function todayMidnightUTC(): Date {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    return d;
}

@Injectable()
export class SwipeLimitGuard implements CanActivate {
    private readonly logger = new Logger(SwipeLimitGuard.name);

    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const userId: string = request.user?.userId;

        if (!userId) return false;

        const midnight = todayMidnightUTC();

        // ── Step 1: Reset counter atomically if the last reset was before today ──
        await this.userModel.updateOne(
            {
                _id: userId,
                $or: [
                    { 'swipeStats.lastResetAt': { $lt: midnight } },
                    { 'swipeStats.lastResetAt': { $exists: false } },
                ],
            },
            {
                $set: {
                    'swipeStats.swipesToday': 0,
                    'swipeStats.lastResetAt': midnight,
                },
            },
        );

        // ── Step 2: Check plan ───────────────────────────────────────────────
        const user = await this.userModel
            .findById(userId)
            .select('subscription swipeStats')
            .exec();

        if (!user) return false;

        const { plan, expiresAt } = user.subscription ?? {};
        const isPremium =
            plan === 'PREMIUM' &&
            (!expiresAt || new Date() < new Date(expiresAt));

        if (isPremium) {
            // PREMIUM — unlimited, just pass through
            return true;
        }

        // ── Step 3: Atomic increment for FREE user ───────────────────────────
        // Increment first, then check. If > limit, roll back and block.
        const updated = await this.userModel
            .findByIdAndUpdate(
                userId,
                { $inc: { 'swipeStats.swipesToday': 1 } },
                { returnDocument: 'after', select: 'swipeStats' },
            )
            .exec();

        const swipesToday = updated?.swipeStats?.swipesToday ?? 1;

        if (swipesToday > FREE_SWIPE_LIMIT) {
            // Rollback the increment
            await this.userModel.findByIdAndUpdate(userId, {
                $inc: { 'swipeStats.swipesToday': -1 },
            });

            this.logger.warn(`Swipe limit reached for FREE user: ${userId}`);

            throw new ForbiddenException({
                errorCode: 'SWIPE_LIMIT_REACHED',
                message: 'Daily swipe limit reached. Upgrade to PREMIUM for unlimited swipes.',
                swipesRemaining: 0,
                limit: FREE_SWIPE_LIMIT,
            });
        }

        this.logger.debug(
            `User ${userId} swiped (${swipesToday}/${FREE_SWIPE_LIMIT} today)`,
        );

        // Attach swipe info to request for downstream use
        request.swipeStats = {
            swipesToday,
            swipesRemaining: Math.max(0, FREE_SWIPE_LIMIT - swipesToday),
        };

        return true;
    }
}
