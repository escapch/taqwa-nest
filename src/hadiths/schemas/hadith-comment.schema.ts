import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type HadithCommentDocument = HadithComment & Document;

@Schema({ timestamps: true })
export class HadithComment {
  @Prop({ type: Types.ObjectId, ref: 'HadithContent', required: true })
  contentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  authorName: string;

  @Prop({ required: true })
  text: string;

  createdAt: Date;
}

export const HadithCommentSchema = SchemaFactory.createForClass(HadithComment);
HadithCommentSchema.index({ contentId: 1, createdAt: 1 });
