import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { PushSubscription, Location } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) { }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email });
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
      email,
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

  async getAllUsers(): Promise<User[]> {
    return this.userModel.find();
  }
}
