import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ProfileController } from './profile.controller';
import { Profile, ProfileSchema } from './profile.schema';
import { ProfileService } from './profile.service';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Profile.name, schema: ProfileSchema }]),
        ConfigModule,
    ],
    controllers: [ProfileController],
    providers: [ProfileService],
    exports: [ProfileService], // Export for potential use in other modules
})
export class ProfileModule { }
