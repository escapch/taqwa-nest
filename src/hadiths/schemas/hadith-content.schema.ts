import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type HadithContentDocument = HadithContent & Document;

@Schema({ timestamps: true })
export class HadithContent {
  @Prop({ required: true })
  text: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop()
  source?: string;

  @Prop({ default: 0 })
  likesCount: number;

  @Prop({ default: 0 })
  commentsCount: number;

  createdAt: Date;
  updatedAt: Date;
}

export const HadithContentSchema = SchemaFactory.createForClass(HadithContent);
HadithContentSchema.index({ createdAt: -1, _id: -1 });
HadithContentSchema.index({ tags: 1 });
