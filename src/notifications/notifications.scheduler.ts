import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service';
import { UsersService } from '../users/users.service';
import { PrayerTimesService } from '../prayer-times/prayer-times.service';
import { TaskService } from '../task/task.service';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
import * as isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isBetween);

@Injectable()
export class NotificationsScheduler {
    private readonly logger = new Logger(NotificationsScheduler.name);
    private readonly sentNotifications = new Set<string>();

    constructor(
        private readonly notificationsService: NotificationsService,
        private readonly usersService: UsersService,
        private readonly prayerTimesService: PrayerTimesService,
        private readonly taskService: TaskService,
    ) { }

    // Runs every minute to check for prayer times
    @Cron('* * * * *')
    async handlePrayerReminders() {
        this.logger.debug('Checking prayer time reminders');

        try {
            const users = await this.usersService.getAllUsers();

            for (const user of users) {
                try {
                    const subscriptions = await this.notificationsService.getUserSubscriptions(String(user._id));

                    if (!user.location || subscriptions.length === 0) {
                        continue;
                    }

                    const userNow = dayjs().tz(user.timezone);
                    const currentTime = userNow.format('HH:mm');
                    const today = userNow.format('YYYY-MM-DD');

                    const prayerTimes = await this.prayerTimesService.getTodayPrayerTimes(
                        user.location.latitude,
                        user.location.longitude,
                        user.timezone,
                    );

                    // Check each prayer time
                    const prayers = [
                        { name: 'Фаджр', time: prayerTimes.Fajr },
                        { name: 'Зухр', time: prayerTimes.Dhuhr },
                        { name: 'Аср', time: prayerTimes.Asr },
                        { name: 'Магриб', time: prayerTimes.Maghrib },
                        { name: 'Иша', time: prayerTimes.Isha },
                    ];

                    for (const prayer of prayers) {
                        const notificationKey = `${user._id}-${today}-${prayer.name}`;

                        // Check if current time matches prayer time (within 1 minute window)
                        if (
                            currentTime === prayer.time &&
                            !this.sentNotifications.has(notificationKey)
                        ) {
                            this.logger.log(
                                `Sending prayer reminder for ${prayer.name} to ${user.email}`,
                            );

                            await this.notificationsService.sendPrayerReminder(
                                String(user._id),
                                prayer.name,
                                prayer.time,
                            );

                            this.sentNotifications.add(notificationKey);

                            // Clean up old notifications (older than 24 hours)
                            setTimeout(() => {
                                this.sentNotifications.delete(notificationKey);
                            }, 24 * 60 * 60 * 1000);
                        }
                    }
                } catch (error) {
                    this.logger.error(
                        `Failed to send prayer reminder to ${user.email}: ${error.message}`,
                    );
                }
            }
        } catch (error) {
            this.logger.error(`Prayer reminder scheduler error: ${error.message}`);
        }
    }

    // Runs every hour to check for end-of-day summaries
    @Cron('0 * * * *')
    async handleEndOfDaySummary() {
        this.logger.debug('Checking end-of-day summaries');

        try {
            const users = await this.usersService.getAllUsers();

            for (const user of users) {
                try {
                    const subscriptions = await this.notificationsService.getUserSubscriptions(String(user._id));

                    if (subscriptions.length === 0) {
                        continue;
                    }

                    const userTime = dayjs().tz(user.timezone);
                    const userHour = userTime.hour();

                    // Send summary at 23:00 (11 PM)
                    if (userHour === 23) {
                        const today = userTime.format('YYYY-MM-DD');
                        const notificationKey = `${user._id}-summary-${today}`;

                        if (this.sentNotifications.has(notificationKey)) {
                            continue;
                        }

                        // Get today's tasks
                        const tasks = await this.taskService.getTasksByDate(
                            String(user._id),
                            today,
                        );

                        const missedPrayers = tasks
                            .filter((task) => !task.isCompleted)
                            .map((task) => task.title);

                        if (missedPrayers.length > 0) {
                            this.logger.log(
                                `Sending end-of-day summary to ${user.email}`,
                            );

                            await this.notificationsService.sendEndOfDaySummary(
                                String(user._id),
                                missedPrayers,
                            );

                            this.sentNotifications.add(notificationKey);

                            setTimeout(() => {
                                this.sentNotifications.delete(notificationKey);
                            }, 24 * 60 * 60 * 1000);
                        }
                    }
                } catch (error) {
                    this.logger.error(
                        `Failed to send end-of-day summary to ${user.email}: ${error.message}`,
                    );
                }
            }
        } catch (error) {
            this.logger.error(`End-of-day summary scheduler error: ${error.message}`);
        }
    }
}
