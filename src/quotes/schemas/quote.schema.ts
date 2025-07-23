import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type QuoteDocument = Quote & Document;

@Schema()
export class Quote {
  @Prop({ required: true })
  text: string;

  @Prop({ required: true })
  source: string;

  @Prop()
  category?: string;
}

export const QuoteSchema = SchemaFactory.createForClass(Quote);
