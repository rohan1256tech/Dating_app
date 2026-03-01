import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
    ) { }

    async findByPhoneNumber(phoneNumber: string): Promise<UserDocument | null> {
        return this.userModel.findOne({ phoneNumber }).exec();
    }

    async create(phoneNumber: string): Promise<UserDocument> {
        const user = new this.userModel({
            phoneNumber,
            isVerified: false,
        });
        return user.save();
    }

    async markAsVerified(userId: string): Promise<UserDocument | null> {
        return this.userModel
            .findByIdAndUpdate(
                userId,
                {
                    isVerified: true,
                    lastLoginAt: new Date(),
                },
                { returnDocument: 'after' },
            )
            .exec();
    }

    async updateLastLogin(userId: string): Promise<void> {
        await this.userModel
            .findByIdAndUpdate(userId, {
                lastLoginAt: new Date(),
            })
            .exec();
    }

    async updateRefreshToken(
        userId: string,
        refreshToken: string,
    ): Promise<void> {
        await this.userModel
            .findByIdAndUpdate(userId, {
                refreshToken,
            })
            .exec();
    }

    async findById(userId: string): Promise<UserDocument | null> {
        return this.userModel.findById(userId).exec();
    }
}
