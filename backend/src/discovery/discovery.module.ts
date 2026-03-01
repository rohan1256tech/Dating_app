import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Profile, ProfileSchema } from '../profile/profile.schema';
import { SubscriptionModule } from '../subscription/subscription.module';
import { User, UserSchema } from '../users/user.schema';
import { DiscoveryController } from './discovery.controller';
import { DiscoveryService } from './discovery.service';
import { SwipeLimitGuard } from './guards/swipe-limit.guard';
import { Match, MatchSchema } from './schemas/match.schema';
import { Swipe, SwipeSchema } from './schemas/swipe.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Swipe.name, schema: SwipeSchema },
            { name: Match.name, schema: MatchSchema },
            { name: Profile.name, schema: ProfileSchema },
            { name: User.name, schema: UserSchema },
        ]),
        SubscriptionModule,
    ],
    controllers: [DiscoveryController],
    providers: [DiscoveryService, SwipeLimitGuard],
    exports: [SwipeLimitGuard],
})
export class DiscoveryModule { }
