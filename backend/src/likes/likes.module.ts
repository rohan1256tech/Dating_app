import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Swipe, SwipeSchema } from '../discovery/schemas/swipe.schema';
import { Profile, ProfileSchema } from '../profile/profile.schema';
import { SubscriptionModule } from '../subscription/subscription.module';
import { LikesController } from './likes.controller';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Swipe.name, schema: SwipeSchema },
            { name: Profile.name, schema: ProfileSchema },
        ]),
        SubscriptionModule,
    ],
    controllers: [LikesController],
})
export class LikesModule { }
