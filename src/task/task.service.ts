import { Injectable, OnModuleInit } from '@nestjs/common';
import { Task, TaskDocument } from './schemas/task.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import * as dayjs from 'dayjs';
import { UsersService } from '../users/users.service';

export type StatsPeriod = 'week' | 'month' | 'year' | 'all';

@Injectable()
export class TaskService implements OnModuleInit {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    private usersService: UsersService,
  ) { }

  private prayerNames = ['Фаджр', 'Зухр', 'Аср', 'Магриб', 'Иша'];
  private customTaskOrder = this.prayerNames.length;

  async onModuleInit() {
    // Backfill `order` on tasks created before this field existed, so
    // existing rows sort correctly instead of relying on Mongo's
    // unspecified natural document order.
    await this.taskModel.updateMany(
      { type: 'fard', order: { $exists: false } },
      [{ $set: { order: { $indexOfArray: [this.prayerNames, '$title'] } } }],
    );
    await this.taskModel.updateMany(
      { type: 'custom', order: { $exists: false } },
      { $set: { order: this.customTaskOrder } },
    );
  }

  async getTodayTasks(userId: string): Promise<Task[]> {
    const today = dayjs().format('YYYY-MM-DD');
    await this.createTasksForUser(userId, today);
    return this.taskModel
      .find({ userId, date: today })
      .sort({ order: 1, createdAt: 1 });
  }

  async createTasksForUser(userId: string, date: string): Promise<void> {
    const existing = await this.taskModel.find({ userId, date });

    if (existing.length === 0) {
      const newTasks = this.prayerNames.map((title, order) => ({
        userId,
        title,
        type: 'fard',
        date,
        order,
      }));
      await this.taskModel.insertMany(newTasks);
    }
  }

  async toggleComplete(taskId: string, userId: string) {
    const task = await this.taskModel.findOne({ _id: taskId, userId });
    if (!task) return null;

    task.isCompleted = !task.isCompleted;
    return task.save();
  }

  async markComplete(taskId: string, userId: string) {
    const task = await this.taskModel.findOne({ _id: taskId, userId });
    if (!task) return null;
    task.isCompleted = true;
    return task.save();
  }

  async addCustomTask(userId: string, title: string) {
    const today = dayjs().format('YYYY-MM-DD');
    const task = new this.taskModel({
      userId,
      title,
      type: 'custom',
      date: today,
      order: this.customTaskOrder,
    });
    return task.save();
  }

  async deleteCustomTask(taskId: string, userId: string) {
    const task = await this.taskModel.findOne({ _id: taskId, userId });

    if (!task || task.type !== 'custom') return null;

    return this.taskModel.deleteOne({ _id: taskId, userId });
  }

  async updateCustomTask(taskId: string, userId: string, newTitle: string) {
    const task = await this.taskModel.findOne({ _id: taskId, userId });

    if (!task || task.type !== 'custom') return null;

    task.title = newTitle;
    return task.save();
  }

  async getTasksByDate(userId: string, date: string) {
    return this.taskModel
      .find({
        userId,
        date,
        type: 'fard',
      })
      .sort({ order: 1, createdAt: 1 });
  }

  private async getStreaks(userId: string): Promise<{ currentStreak: number; bestStreak: number }> {
    const allTasks = await this.taskModel
      .find({ userId, type: 'fard' })
      .sort({ date: 1 });

    const dateMap = new Map<string, { total: number; completed: number }>();

    allTasks.forEach((task) => {
      const date = task.date;
      if (!dateMap.has(date)) {
        dateMap.set(date, { total: 0, completed: 0 });
      }

      const dayStats = dateMap.get(date)!;
      dayStats.total += 1;
      if (task.isCompleted) dayStats.completed += 1;
    });

    let currentStreak = 0;
    let bestStreak = 0;

    const sortedDates = Array.from(dateMap.keys()).sort();

    for (let i = 0; i < sortedDates.length; i++) {
      const date = sortedDates[i];
      const { total, completed } = dateMap.get(date)!;

      const isFullDay = total === 5 && completed === 5;

      if (i > 0) {
        const prevDate = dayjs(sortedDates[i - 1]);
        const currDate = dayjs(date);

        const diff = currDate.diff(prevDate, 'day');

        if (diff === 1 && isFullDay) {
          currentStreak += 1;
        } else if (diff === 1 && !isFullDay) {
          currentStreak = 0;
        } else if (diff > 1) {
          currentStreak = isFullDay ? 1 : 0;
        }
      } else {
        currentStreak = isFullDay ? 1 : 0;
      }

      if (currentStreak > bestStreak) {
        bestStreak = currentStreak;
      }
    }

    return { currentStreak, bestStreak };
  }

  async getLifetimeStats(userId: string): Promise<{
    currentStreak: number;
    bestStreak: number;
    completedFards: number;
    hasPerfectMonth: boolean;
  }> {
    const allTasks = await this.taskModel
      .find({ userId, type: 'fard' })
      .sort({ date: 1 });

    const dateMap = new Map<string, { total: number; completed: number }>();
    let completedFards = 0;

    allTasks.forEach((task) => {
      const date = task.date;
      if (!dateMap.has(date)) {
        dateMap.set(date, { total: 0, completed: 0 });
      }

      const dayStats = dateMap.get(date)!;
      dayStats.total += 1;
      if (task.isCompleted) {
        dayStats.completed += 1;
        completedFards += 1;
      }
    });

    const { currentStreak, bestStreak } = await this.getStreaks(userId);

    const currentMonth = dayjs().format('YYYY-MM');
    const monthMap = new Map<string, { total: number; completed: number }>();
    dateMap.forEach(({ total, completed }, date) => {
      const month = date.slice(0, 7);
      if (month === currentMonth) return;
      if (!monthMap.has(month)) monthMap.set(month, { total: 0, completed: 0 });
      const monthStats = monthMap.get(month)!;
      monthStats.total += total;
      monthStats.completed += completed;
    });

    let hasPerfectMonth = false;
    monthMap.forEach(({ total, completed }, month) => {
      const expectedTotal = dayjs(month, 'YYYY-MM').daysInMonth() * 5;
      if (total === expectedTotal && completed === expectedTotal) {
        hasPerfectMonth = true;
      }
    });

    return { currentStreak, bestStreak, completedFards, hasPerfectMonth };
  }

  async getStatsOverview(userId: string, period: StatsPeriod) {
    const user = await this.usersService.findById(userId);
    const today = dayjs();
    const registeredAt = dayjs(user?.registeredAt ?? today);

    let from: dayjs.Dayjs;
    switch (period) {
      case 'week':
        from = today.subtract(6, 'day');
        break;
      case 'month':
        from = today.subtract(29, 'day');
        break;
      case 'year':
        from = today.subtract(364, 'day');
        break;
      case 'all':
      default:
        from = registeredAt;
        break;
    }
    if (from.isBefore(registeredAt, 'day')) from = registeredAt;

    const fromStr = from.format('YYYY-MM-DD');
    const toStr = today.format('YYYY-MM-DD');

    const [facetResult] = await this.taskModel.aggregate([
      {
        $match: {
          userId,
          type: 'fard',
          date: { $gte: fromStr, $lte: toStr },
        },
      },
      {
        $facet: {
          daily: [
            {
              $group: {
                _id: '$date',
                total: { $sum: 1 },
                completed: { $sum: { $cond: ['$isCompleted', 1, 0] } },
              },
            },
            { $sort: { _id: 1 } },
          ],
          byPrayer: [
            {
              $group: {
                _id: '$title',
                total: { $sum: 1 },
                completed: { $sum: { $cond: ['$isCompleted', 1, 0] } },
              },
            },
          ],
        },
      },
    ]);

    const dailyMap = new Map<string, { total: number; completed: number }>(
      facetResult.daily.map((d: { _id: string; total: number; completed: number }) => [
        d._id,
        { total: d.total, completed: d.completed },
      ]),
    );

    const daily: { date: string; total: number; completed: number }[] = [];
    let cursor = from;
    while (cursor.isBefore(today, 'day') || cursor.isSame(today, 'day')) {
      const dateStr = cursor.format('YYYY-MM-DD');
      const rec = dailyMap.get(dateStr);
      daily.push({ date: dateStr, total: rec?.total ?? 0, completed: rec?.completed ?? 0 });
      cursor = cursor.add(1, 'day');
    }

    const prayerMap = new Map<string, { total: number; completed: number }>(
      facetResult.byPrayer.map((p: { _id: string; total: number; completed: number }) => [
        p._id,
        { total: p.total, completed: p.completed },
      ]),
    );

    const byPrayer = this.prayerNames.map((name) => {
      const rec = prayerMap.get(name);
      const total = rec?.total ?? 0;
      const completed = rec?.completed ?? 0;
      return {
        name,
        total,
        completed,
        percent: total ? Math.round((completed / total) * 100) : 0,
      };
    });

    const totalFards = daily.reduce((sum, d) => sum + d.total, 0);
    const completedFards = daily.reduce((sum, d) => sum + d.completed, 0);
    const percentCompleted = totalFards
      ? Math.round((completedFards / totalFards) * 100)
      : 0;

    const { currentStreak, bestStreak } = await this.getStreaks(userId);

    return {
      period,
      range: { from: fromStr, to: toStr },
      summary: {
        percentCompleted,
        completedFards,
        totalFards,
        currentStreak,
        bestStreak,
      },
      daily,
      byPrayer,
    };
  }
}
