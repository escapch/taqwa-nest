import { Injectable } from '@nestjs/common';
import { Task, TaskDocument } from './schemas/task.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import * as dayjs from 'dayjs';

@Injectable()
export class TaskService {
  constructor(@InjectModel(Task.name) private taskModel: Model<TaskDocument>) {}

  private prayerNames = ['Фаджр', 'Зухр', 'Аср', 'Магриб', 'Иша'];

  async getTodayTasks(userId: string): Promise<Task[]> {
    const today = dayjs().format('YYYY-MM-DD');

    const existing = await this.taskModel.find({ userId, date: today });

    if (existing.length === 0) {
      const newTasks = this.prayerNames.map((title) => ({
        userId,
        title,
        type: 'fard',
        date: today,
      }));
      await this.taskModel.insertMany(newTasks);
    }

    return this.taskModel.find({ userId, date: today });
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
    return this.taskModel.find({
      userId,
      date,
      type: 'fard',
    });
  }

  async getStats(userId: string) {
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

    const totalFards = allTasks.length;
    const completedFards = allTasks.filter((t) => t.isCompleted).length;
    const percentCompleted = totalFards
      ? Math.round((completedFards / totalFards) * 100)
      : 0;

    return {
      currentStreak,
      bestStreak,
      totalFards,
      completedFards,
      percentCompleted,
    };
  }
}
