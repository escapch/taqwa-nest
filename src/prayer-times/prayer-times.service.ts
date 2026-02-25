import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export interface PrayerTimes {
    Fajr: string;
    Dhuhr: string;
    Asr: string;
    Maghrib: string;
    Isha: string;
    date: string;
}

@Injectable()
export class PrayerTimesService {
    private readonly logger = new Logger(PrayerTimesService.name);
    private readonly cache = new Map<string, { data: PrayerTimes; expiry: number }>();

    constructor(private readonly httpService: HttpService) { }

    async getPrayerTimes(
        date: string,
        latitude: number,
        longitude: number,
        userTimezone: string,
        method: number = 2, // 2 = Islamic Society of North America (ISNA)
    ): Promise<PrayerTimes> {
        const cacheKey = `${date}-${latitude}-${longitude}-${method}`;

        // Check cache
        const cached = this.cache.get(cacheKey);
        if (cached && cached.expiry > Date.now()) {
            this.logger.debug(`Cache hit for ${cacheKey}`);
            return cached.data;
        }

        try {
            // Aladhan API: http://api.aladhan.com/v1/timings/:date
            const timestamp = dayjs(date).unix();
            const url = `http://api.aladhan.com/v1/timings/${timestamp}`;

            const response = await firstValueFrom(
                this.httpService.get(url, {
                    params: {
                        latitude,
                        longitude,
                        method,
                    },
                }),
            );

            const timings = response.data.data.timings;

            const prayerTimes: PrayerTimes = {
                Fajr: timings.Fajr,
                Dhuhr: timings.Dhuhr,
                Asr: timings.Asr,
                Maghrib: timings.Maghrib,
                Isha: timings.Isha,
                date,
            };

            // Cache for 24 hours
            this.cache.set(cacheKey, {
                data: prayerTimes,
                expiry: Date.now() + 24 * 60 * 60 * 1000,
            });

            return prayerTimes;
        } catch (error) {
            this.logger.error(`Failed to fetch prayer times: ${error.message}`);
            throw new Error('Failed to fetch prayer times');
        }
    }

    async getTodayPrayerTimes(
        latitude: number,
        longitude: number,
        userTimezone: string,
    ): Promise<PrayerTimes> {
        const today = dayjs().tz(userTimezone).format('YYYY-MM-DD');
        return this.getPrayerTimes(today, latitude, longitude, userTimezone);
    }
}
