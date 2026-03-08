import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { FirebaseAdminService } from './firebase-admin.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
    imports: [
        ConfigModule,
        UsersModule,
        PassportModule,
        JwtModule.register({}),
    ],
    controllers: [AuthController],
    providers: [AuthService, FirebaseAdminService, JwtStrategy],
    exports: [AuthService],
})
export class AuthModule { }
