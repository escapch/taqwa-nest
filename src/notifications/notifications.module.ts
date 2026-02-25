import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsScheduler } from './notifications.scheduler';
import { UsersModule } from '../users/users.module';
import { TaskModule } from '../task/task.module';
import { PrayerTimesModule } from '../prayer-times/prayer-times.module';
import { PushSubscription, PushSubscriptionSchema } from './schemas/push-subscription.schema';

@Module({
    imports: [
        ConfigModule,
        UsersModule,
        TaskModule,
        PrayerTimesModule,
        MongooseModule.forFeature([
            { name: PushSubscription.name, schema: PushSubscriptionSchema },
        ]),
    ],
    controllers: [NotificationsController],
    providers: [NotificationsService, NotificationsScheduler],
    exports: [NotificationsService],
})
export class NotificationsModule { }
