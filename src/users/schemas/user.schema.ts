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

@Schema()
export class User extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

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
}

export const UserSchema = SchemaFactory.createForClass(User);
