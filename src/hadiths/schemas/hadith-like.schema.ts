import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type HadithLikeDocument = HadithLike & Document;

@Schema({ timestamps: true })
export class HadithLike {
  @Prop({ type: Types.ObjectId, ref: 'HadithContent', required: true })
  contentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;
}

export const HadithLikeSchema = SchemaFactory.createForClass(HadithLike);
HadithLikeSchema.index({ contentId: 1, userId: 1 }, { unique: true });
