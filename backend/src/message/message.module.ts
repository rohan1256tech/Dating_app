import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { Match, MatchSchema } from '../discovery/schemas/match.schema';
import { ChatGateway } from './chat.gateway';
import { MessageController } from './message.controller';
import { Message, MessageSchema } from './message.schema';
import { MessageService } from './message.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Message.name, schema: MessageSchema },
            { name: Match.name, schema: MatchSchema },
        ]),
        ConfigModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('jwt.accessSecret') || 'default-secret',
            }),
            inject: [ConfigService],
        }),
    ],
    controllers: [MessageController],
    providers: [MessageService, ChatGateway],
    exports: [MessageService, ChatGateway],
})
export class MessageModule { }