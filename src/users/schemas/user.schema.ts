import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface Location {
  latitude: number;
  longitude: number;
}

export interface UnlockedAchievement {
  key: string;
  unlockedAt: Date;
}

@Schema()
export class User extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  password?: string;

  @Prop()
  name: string;

  @Prop({ type: Date, default: Date.now })
  registeredAt: Date;

  @Prop({ required: true, default: 'UTC' })
  timezone: string;

  @Prop({ type: Object })
  location?: Location;

  @Prop({ type: Array, default: [] })
  pushSubscriptions: PushSubscription[];

  @Prop({ type: Array, default: [] })
  unlockedAchievements: UnlockedAchievement[];

  @Prop({ type: Boolean, default: false })
  isAdmin: boolean;

  @Prop()
  resetPasswordTokenHash?: string;

  @Prop({ type: Date })
  resetPasswordExpires?: Date;

  @Prop()
  googleId?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
