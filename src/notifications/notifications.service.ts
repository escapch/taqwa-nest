import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as webpush from 'web-push';
import { UsersService } from '../users/users.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { PushSubscription } from './schemas/push-subscription.schema';

@Injectable()
export class NotificationsService implements OnModuleInit {
    public readonly logger = new Logger(NotificationsService.name);

    constructor(
        private readonly configService: ConfigService,
        private readonly usersService: UsersService,
        @InjectModel(PushSubscription.name)
        private readonly subscriptionModel: Model<PushSubscription>,
    ) { }


    onModuleInit() {
        const vapidPublicKey = this.configService.get<string>('VAPID_PUBLIC_KEY');
        const vapidPrivateKey = this.configService.get<string>('VAPID_PRIVATE_KEY');
        const vapidSubject = this.configService.get<string>('VAPID_SUBJECT');

        if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
            this.logger.warn(
                'VAPID keys not configured. Push notifications will not work.',
            );
            return;
        }

        webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
        this.logger.log('Web push configured successfully');
    }

    getVapidPublicKey(): string {
        return this.configService.get<string>('VAPID_PUBLIC_KEY') || '';
    }

    async saveSubscription(
        userId: string,
        dto: CreateSubscriptionDto,
    ): Promise<void> {
        await this.subscriptionModel.findOneAndUpdate(
            { endpoint: dto.endpoint },
            {
                userId: new Types.ObjectId(userId),
                endpoint: dto.endpoint,
                keys: dto.keys,
            },
            { upsert: true, new: true },
        );
    }

    async getUserSubscriptions(userId: string): Promise<PushSubscription[]> {
        return this.subscriptionModel.find({
            userId: new Types.ObjectId(userId),
        });
    }

    async getAllSubscriptions(): Promise<PushSubscription[]> {
        return this.subscriptionModel.find().lean();
    }

    async deleteAllSubscriptions(): Promise<void> {
        await this.subscriptionModel.deleteMany({});
        this.logger.log('All subscriptions deleted from database');
    }

    async removeExpiredSubscription(endpoint: string): Promise<void> {
        await this.subscriptionModel.deleteOne({ endpoint });
    }

    async sendToUser(
        userId: string,
        payload: { title: string; body: string; data?: any },
    ): Promise<void> {
        const subscriptions = await this.getUserSubscriptions(userId);
        for (const sub of subscriptions) {
            await this.sendPushNotification(sub, payload);
        }
    }

    async sendPushNotification(
        subscription: any,
        payload: { title: string; body: string; data?: any },
    ): Promise<boolean> {
        try {
            // webpush.sendNotification expects { endpoint, keys }
            const pushConfig = {
                endpoint: subscription.endpoint,
                keys: subscription.keys,
            };

            await webpush.sendNotification(
                pushConfig,
                JSON.stringify(payload),
            );
            return true;
        } catch (error: any) {
            if (error.statusCode === 410 || error.statusCode === 404 || error.statusCode === 403) {
                this.logger.warn(`Subscription invalid or expired (Status: ${error.statusCode}): ${subscription.endpoint}. Removing.`);
                await this.removeExpiredSubscription(subscription.endpoint);
                return false;
            }
            this.logger.error(
                `Failed to send push to ${subscription.endpoint}: ${error.message} ` +
                `(Status: ${error.statusCode}, Body: ${error.body})`,
            );
            return false;
        }
    }

    async sendPrayerReminder(
        userId: string,
        prayerName: string,
        prayerTime: string,
    ): Promise<void> {
        const payload = {
            title: `Время намаза: ${prayerName}`,
            body: `Наступило время ${prayerName} намаза (${prayerTime})`,
            data: {
                type: 'prayer_reminder',
                prayerName,
                prayerTime,
            },
        };

        await this.sendToUser(userId, payload);
    }

    async sendEndOfDaySummary(
        userId: string,
        missedPrayers: string[],
    ): Promise<void> {
        if (missedPrayers.length === 0) return;

        const payload = {
            title: 'Итог дня',
            body: `Пропущенные намазы: ${missedPrayers.join(', ')}`,
            data: {
                type: 'daily_summary',
                missedPrayers,
            },
        };

        await this.sendToUser(userId, payload);
    }
}
