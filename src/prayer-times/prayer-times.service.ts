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
    Sunrise: string;
    Dhuhr: string;
    Asr: string;
    Sunset: string;
    Maghrib: string;
    Isha: string;
    Tahajjud: string;
    Weekday: string;
    date: string;
}

interface MuftiyatPrayerTime {
    id: number;
    date: string;
    weekday: string;
    fajr: string;
    sunrise: string;
    dhuhr: string;
    asr: string;
    sunset: string;
    maghrib: string;
    isha: string;
    tahajjud: string;
}

interface MuftiyatResponse {
    lat: number;
    lng: number;
    prayertimes: MuftiyatPrayerTime[];
}

@Injectable()
export class PrayerTimesService {
    private readonly logger = new Logger(PrayerTimesService.name);
    private readonly cache = new Map<string, { data: PrayerTimes; expiry: number }>();
    private readonly BASE_URL = 'https://muftiyat.kg';

    constructor(private readonly httpService: HttpService) { }

    async getPrayerTimes(
        date: string,
        latitude: number,
        longitude: number,
        userTimezone: string,
    ): Promise<PrayerTimes> {
        const cacheKey = `${date}-${latitude}-${longitude}`;

        // Check cache
        const cached = this.cache.get(cacheKey);
        if (cached && cached.expiry > Date.now()) {
            this.logger.debug(`Cache hit for ${cacheKey}`);
            return cached.data;
        }

        try {
            // Muftiyat KG API — точные времена намаза для Кыргызстана
            const formattedDate = dayjs(date).format('DD-MM-YYYY');
            const url = `${this.BASE_URL}/ru/api/v1/calendar/`;

            const response = await firstValueFrom(
                this.httpService.get<MuftiyatResponse>(url, {
                    params: {
                        lat: latitude,
                        lng: longitude,
                        start: formattedDate,
                        end: formattedDate,
                    },
                }),
            );

            const timings = response.data.prayertimes?.[0];

            if (!timings) {
                throw new Error(`No prayer times returned for date ${date}`);
            }

            const prayerTimes: PrayerTimes = {
                Fajr: timings.fajr,
                Sunrise: timings.sunrise,
                Dhuhr: timings.dhuhr,
                Asr: timings.asr,
                Sunset: timings.sunset,
                Maghrib: timings.maghrib,
                Isha: timings.isha,
                Tahajjud: timings.tahajjud,
                Weekday: timings.weekday,
                date,
            };

            // Cache for 24 hours
            this.cache.set(cacheKey, {
                data: prayerTimes,
                expiry: Date.now() + 24 * 60 * 60 * 1000,
            });

            return prayerTimes;
        } catch (error) {
            this.logger.error(`Failed to fetch prayer times from Muftiyat KG: ${error.message}`);
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

