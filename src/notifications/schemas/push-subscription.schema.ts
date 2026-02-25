import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class PushSubscription extends Document {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ required: true })
    endpoint: string;

    @Prop({
        type: {
            p256dh: String,
            auth: String,
        },
        required: true,
    })
    keys: {
        p256dh: string;
        auth: string;
    };
}

export const PushSubscriptionSchema =
    SchemaFactory.createForClass(PushSubscription);

// Уникальный индекс: один endpoint = одна запись
PushSubscriptionSchema.index({ endpoint: 1 }, { unique: true });
