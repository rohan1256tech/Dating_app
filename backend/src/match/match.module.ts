import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Match, MatchSchema } from '../discovery/schemas/match.schema';
import { Profile, ProfileSchema } from '../profile/profile.schema';
import { MatchController } from './match.controller';
import { MatchService } from './match.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Match.name, schema: MatchSchema },
            { name: Profile.name, schema: ProfileSchema },
        ]),
    ],
    controllers: [MatchController],
    providers: [MatchService],
    exports: [MatchService],
})
export class MatchModule { }
