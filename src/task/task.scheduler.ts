import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TaskService } from './task.service';
import { UsersService } from '../users/users.service';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class TaskScheduler {
    private readonly logger = new Logger(TaskScheduler.name);

    constructor(
        private readonly taskService: TaskService,
        private readonly usersService: UsersService,
    ) { }

    // Runs every hour to check which users need tasks created
    @Cron('0 * * * *')
    async handleTaskCreation() {
        this.logger.log('Running task creation scheduler');

        try {
            const users = await this.usersService.getAllUsers();

            for (const user of users) {
                try {
                    // Calculate user's current local time
                    const userTime = dayjs().tz(user.timezone);
                    const today = userTime.format('YYYY-MM-DD');

                    // Create tasks if they don't exist for today
                    await this.taskService.createTasksForUser(
                        String(user._id),
                        today,
                    );
                } catch (error) {
                    this.logger.error(
                        `Failed to handle tasks for user ${user.email}: ${error.message}`,
                    );
                }
            }
        } catch (error) {
            this.logger.error(`Task creation scheduler error: ${error.message}`);
        }
    }
}
