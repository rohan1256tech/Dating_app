import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Profile, ProfileDocument } from '../profile/profile.schema';
import { SubscriptionService } from '../subscription/subscription.service';
import { CreateSwipeDto } from './dto/create-swipe.dto';
import { Match, MatchDocument } from './schemas/match.schema';
import { Swipe, SwipeDocument } from './schemas/swipe.schema';

const FREE_MAX_DISTANCE = 5000;     // 5 km
const PREMIUM_MAX_DISTANCE = 50000; // 50 km


// ─── Gender compatibility helper ─────────────────────────────────────────────
// Returns the lookingFor values that would include a given gender.
// e.g. a 'Male' user is visible to those who look for 'Men' or 'Everyone'.
function compatibleLookingFor(gender: string): string[] {
    if (gender === 'Male') return ['Men', 'Everyone'];
    if (gender === 'Female') return ['Women', 'Everyone'];
    return ['Everyone', 'Men', 'Women'];  // 'Other' → visible to all
}

@Injectable()
export class DiscoveryService {
    private readonly logger = new Logger(DiscoveryService.name);

    constructor(
        @InjectModel(Swipe.name) private swipeModel: Model<SwipeDocument>,
        @InjectModel(Match.name) private matchModel: Model<MatchDocument>,
        @InjectModel(Profile.name) private profileModel: Model<ProfileDocument>,
        private readonly subscriptionService: SubscriptionService,
    ) { }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /** Maps GeoJSON coordinates [lng, lat] to { latitude, longitude }. Returns null if missing. */
    private mapCoords(profile: ProfileDocument): { latitude: number; longitude: number } | null {
        if (profile.location?.coordinates?.length === 2) {
            const [lng, lat] = profile.location.coordinates;
            if (isFinite(lat) && isFinite(lng)) return { latitude: lat, longitude: lng };
        }
        if (profile.legacyLocation?.latitude !== undefined && profile.legacyLocation?.longitude !== undefined) {
            return { latitude: profile.legacyLocation.latitude, longitude: profile.legacyLocation.longitude };
        }
        return null;
    }

    // ── Discovery ─────────────────────────────────────────────────────────────

    async getPotentialMatches(userId: string) {
        this.logger.log(`Fetching potential matches for user: ${userId}`);
        const userObjectId = new Types.ObjectId(userId);
        const now = new Date();

        // Load current user's profile to get their gender and lookingFor
        const currentUserProfile = await this.profileModel.findOne({ userId: userObjectId } as any).exec();
        const lookingFor = currentUserProfile?.lookingFor || 'Everyone';
        const myGender = currentUserProfile?.gender || '';

        // Filter 1: what gender the current user wants to see
        let genderFilter: any = {};
        if (lookingFor === 'Men') genderFilter = { gender: 'Male' };
        else if (lookingFor === 'Women') genderFilter = { gender: 'Female' };
        // 'Everyone' → no gender filter

        // Filter 2: only show profiles whose lookingFor includes current user's gender
        const visibleToFilter: any = myGender
            ? { lookingFor: { $in: compatibleLookingFor(myGender) } }
            : {};

        const swipedDocs = await this.swipeModel.find({ swiperId: userObjectId } as any).select('targetId').exec();
        const swipedIds = swipedDocs.map(doc => doc.targetId);

        this.logger.log(`User ${userId} (gender:${myGender}, lookingFor:${lookingFor}) — already swiped: ${swipedIds.length}`);

        const potentialMatches = await this.profileModel.find({
            userId: { $nin: [...swipedIds, userObjectId] },
            profileCompleted: true,
            ...genderFilter,
            ...visibleToFilter,
        } as any)
            .sort({ 'boost.isActive': -1 })
            .limit(20)
            .exec();

        // Sort in memory: active/non-expired boosts truly first
        potentialMatches.sort((a: any, b: any) => {
            const aBoost = a.boost?.isActive && a.boost?.expiresAt && new Date(a.boost.expiresAt) > now ? 1 : 0;
            const bBoost = b.boost?.isActive && b.boost?.expiresAt && new Date(b.boost.expiresAt) > now ? 1 : 0;
            return bBoost - aBoost;
        });

        this.logger.log(`Found ${potentialMatches.length} potential matches`);

        return potentialMatches.map(p => ({
            id: p.userId.toString(),
            name: p.name,
            age: p.age,
            gender: p.gender,
            bio: p.bio || '',
            image: p.photos && p.photos.length > 0 ? p.photos[0] : null,
            interests: p.interests || [],
            // Correctly mapped lat/lon (not raw GeoJSON)
            location: this.mapCoords(p) ?? { latitude: 0, longitude: 0 },
        }));
    }

    // ── Swipe ─────────────────────────────────────────────────────────────────

    async swipe(userId: string, createSwipeDto: CreateSwipeDto) {
        const { targetId, action } = createSwipeDto;
        const swiperObjectId = new Types.ObjectId(userId);
        const targetObjectId = new Types.ObjectId(targetId);

        if (userId === targetId) {
            throw new BadRequestException('Cannot swipe on yourself');
        }


        // ── Record the swipe ──────────────────────────────────────────────────
        try {
            await this.swipeModel.create({
                swiperId: swiperObjectId,
                targetId: targetObjectId,
                action,
            } as any);
        } catch (error: any) {
            if (error.code === 11000) {
                this.logger.warn(`Duplicate swipe attempt by ${userId} on ${targetId}`);
                return { matched: false, message: 'Already swiped' };
            }
            throw error;
        }

        // ── Check for mutual match ────────────────────────────────────────────
        let isMatch = false;
        let matchData: MatchDocument | null = null;

        if (action === 'LIKE' || action === 'SUPERLIKE') {
            const reciprocatedSwipe = await this.swipeModel.findOne({
                swiperId: targetObjectId,
                targetId: swiperObjectId,
                action: { $in: ['LIKE', 'SUPERLIKE'] },
            } as any).exec();

            if (reciprocatedSwipe) {
                isMatch = true;
                const ids = [swiperObjectId, targetObjectId].sort((a, b) => a.toString().localeCompare(b.toString()));
                const user1Id = ids[0];
                const user2Id = ids[1];

                try {
                    matchData = await this.matchModel.create({ user1Id, user2Id } as any) as unknown as MatchDocument;
                    this.logger.log(`Match created between ${userId} and ${targetId}`);
                } catch (error: any) {
                    if (error.code === 11000) {
                        matchData = await this.matchModel.findOne({ user1Id, user2Id } as any).exec();
                    }
                }
            }
        }

        return {
            matched: isMatch,
            matchData: isMatch && matchData ? {
                matchId: matchData._id.toString(),
                user1Id: matchData.user1Id.toString(),
                user2Id: matchData.user2Id.toString(),
                createdAt: matchData.createdAt,
            } : undefined,
        };
    }

    // ── Nearby (Map) ──────────────────────────────────────────────────────────

    /**
     * Nearby users — enforces radius cap server-side:
     * FREE  → max 5 km
     * PREMIUM → max 50 km
     */
    async getNearbyUsers(userId: string, requestedDistance: number = 5000) {
        this.logger.log(`Fetching nearby users for ${userId}, requested: ${requestedDistance}m`);

        const isPremium = await this.subscriptionService.isPremium(userId);
        const maxDistance = isPremium
            ? Math.min(requestedDistance, PREMIUM_MAX_DISTANCE)
            : Math.min(requestedDistance, FREE_MAX_DISTANCE);

        this.logger.log(`${isPremium ? 'PREMIUM' : 'FREE'} user — capped to ${maxDistance}m`);

        const userObjectId = new Types.ObjectId(userId);

        const userProfile = await this.profileModel.findOne({ userId: userObjectId } as any).exec();
        if (!userProfile || !userProfile.location || !userProfile.location.coordinates || userProfile.location.coordinates.length < 2) {
            // User hasn't shared their location yet — return empty result instead of 500
            this.logger.warn(`[getNearbyUsers] No location for user ${userId} — returning empty`);
            return { isPremium, maxDistance, users: [] };
        }

        const [userLng, userLat] = userProfile.location.coordinates;

        const nearbyProfiles = await this.profileModel.find({
            userId: { $ne: userObjectId },
            showOnMap: true,
            location: {
                $near: {
                    $geometry: { type: 'Point', coordinates: [userLng, userLat] },
                    $maxDistance: maxDistance,
                },
            },
        } as any).limit(50).exec();

        const fuzzedProfiles = nearbyProfiles.map(profile => {
            if (!profile.location?.coordinates) return null;

            const [lng, lat] = profile.location.coordinates;
            const fuzzRadius = 0.0045;
            const angle = Math.random() * 2 * Math.PI;
            const distance = Math.random() * fuzzRadius;
            const fuzzedLng = lng + (distance * Math.cos(angle));
            const fuzzedLat = lat + (distance * Math.sin(angle));

            const R = 6371e3;
            const φ1 = userLat * Math.PI / 180;
            const φ2 = lat * Math.PI / 180;
            const Δφ = (lat - userLat) * Math.PI / 180;
            const Δλ = (lng - userLng) * Math.PI / 180;
            const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
            const actualDistance = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));

            return {
                userId: profile.userId.toString(),
                name: profile.name,
                age: profile.age,
                gender: profile.gender,
                photo: profile.photos?.[0] || '',
                location: { latitude: fuzzedLat, longitude: fuzzedLng },
                distance: actualDistance,
            };
        }).filter(Boolean);

        return {
            isPremium,
            maxDistance,
            users: fuzzedProfiles,
        };
    }

    async updateMapLocation(userId: string, latitude: number, longitude: number, showOnMap: boolean) {
        this.logger.log(`Updating map location for ${userId}`);
        const userObjectId = new Types.ObjectId(userId);

        const profile = await this.profileModel.findOneAndUpdate(
            { userId: userObjectId } as any,
            {
                location: { type: 'Point', coordinates: [longitude, latitude] },
                legacyLocation: { latitude, longitude },
                showOnMap,
                lastMapLocationUpdate: new Date(),
            } as any,
            { returnDocument: 'after' }
        ).exec();

        if (!profile) throw new Error('Profile not found');

        return { success: true, showOnMap: profile.showOnMap };
    }
}
