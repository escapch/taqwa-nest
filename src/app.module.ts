import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { TaskModule } from './task/task.module';
import { MissedModule } from './missed/missed.module';
import { QuotesModule } from './quotes/quotes.module';
import { PrayerTimesModule } from './prayer-times/prayer-times.module';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationsModule } from './notifications/notifications.module';
import { AchievementsModule } from './achievements/achievements.module';
import { HadithsModule } from './hadiths/hadiths.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    ScheduleModule.forRoot(),
    AuthModule,
    UsersModule,
    MongooseModule.forRoot(process.env.DATABASE_URL || ''),
    TaskModule,
    MissedModule,
    QuotesModule,
    PrayerTimesModule,
    NotificationsModule,
    AchievementsModule,
    HadithsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule { }
