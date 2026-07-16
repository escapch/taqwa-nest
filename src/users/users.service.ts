import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { PushSubscription, Location, UnlockedAchievement } from './schemas/user.schema';
import * as bcrypt from 'bcryptjs';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) { }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email: email.trim().toLowerCase() });
  }

  async findById(userId: string): Promise<User | null> {
    return this.userModel.findById(userId);
  }

  async create(
    email: string,
    hashedPassword: string,
    timezone: string = 'UTC',
    name?: string,
  ): Promise<User> {
    const newUser = new this.userModel({
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      name,
      timezone,
      registeredAt: new Date(),
    });
    return newUser.save();
  }

  async updateLocation(
    userId: string,
    latitude: number,
    longitude: number,
  ): Promise<User | null> {
    return this.userModel.findByIdAndUpdate(
      userId,
      { location: { latitude, longitude } },
      { new: true },
    );
  }

  async deleteLocation(userId: string): Promise<User | null> {
    return this.userModel.findByIdAndUpdate(
      userId,
      { $unset: { location: "" } },
      { new: true },
    );
  }

  async addPushSubscription(
    userId: string,
    subscription: PushSubscription,
  ): Promise<User | null> {
    return this.userModel.findByIdAndUpdate(
      userId,
      { $addToSet: { pushSubscriptions: subscription } },
      { new: true },
    );
  }

  async removePushSubscription(
    userId: string,
    endpoint: string,
  ): Promise<User | null> {
    return this.userModel.findByIdAndUpdate(
      userId,
      { $pull: { pushSubscriptions: { endpoint } } },
      { new: true },
    );
  }

  async addUnlockedAchievements(
    userId: string,
    achievements: UnlockedAchievement[],
  ): Promise<User | null> {
    return this.userModel.findByIdAndUpdate(
      userId,
      { $push: { unlockedAchievements: { $each: achievements } } },
      { new: true },
    );
  }

  async getAllUsers(): Promise<User[]> {
    return this.userModel.find();
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<User | null> {
    const updateData: Partial<Pick<User, 'name' | 'email'>> = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.email !== undefined) updateData.email = dto.email;

    return this.userModel.findByIdAndUpdate(userId, updateData, { new: true });
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (!user || !user.password) throw new UnauthorizedException('Пользователь не найден');

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch)
      throw new UnauthorizedException('Неверный текущий пароль');

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userModel.findByIdAndUpdate(userId, {
      password: hashedPassword,
    });
  }

  async deleteAccount(userId: string): Promise<void> {
    await this.userModel.findByIdAndDelete(userId);
  }

  async setResetPasswordToken(
    userId: string,
    tokenHash: string,
    expires: Date,
  ): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpires: expires,
    });
  }

  async findByResetTokenHash(tokenHash: string): Promise<User | null> {
    return this.userModel.findOne({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpires: { $gt: new Date() },
    });
  }

  async resetPassword(userId: string, hashedPassword: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      password: hashedPassword,
      $unset: { resetPasswordTokenHash: '', resetPasswordExpires: '' },
    });
  }

  async findOrCreateByGoogle(params: {
    googleId: string;
    email: string;
    name?: string;
  }): Promise<User> {
    const email = params.email.trim().toLowerCase();
    let user = await this.userModel.findOne({
      $or: [{ googleId: params.googleId }, { email }],
    });

    if (user) {
      if (!user.googleId) {
        user.googleId = params.googleId;
        await user.save();
      }
      return user;
    }

    user = new this.userModel({
      email,
      googleId: params.googleId,
      name: params.name,
      timezone: 'UTC',
      registeredAt: new Date(),
    });
    return user.save();
  }
}
