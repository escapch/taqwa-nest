import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TaskDocument = Task & Document;

@Schema()
export class Task {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  title: string;

  @Prop({ enum: ['fard', 'custom'], default: 'fard' })
  type: 'fard' | 'custom';

  @Prop({ required: true })
  date: string;

  @Prop({ default: false })
  isCompleted: boolean;
}

export const TaskSchema = SchemaFactory.createForClass(Task);
