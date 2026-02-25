import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PrayerTimesService } from './prayer-times.service';
import { PrayerTimesController } from './prayer-times.controller';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [HttpModule, UsersModule],
    controllers: [PrayerTimesController],
    providers: [PrayerTimesService],
    exports: [PrayerTimesService],
})
export class PrayerTimesModule { }
