import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Task, TaskDocument } from '../task/schemas/task.schema';
import { Model } from 'mongoose';
import * as dayjs from 'dayjs';

@Injectable()
export class MissedService {
  constructor(@InjectModel(Task.name) private taskModel: Model<TaskDocument>) { }

  // Получить список всех дат с пропущенными фард-намазами
  async getMissedDates(userId: string): Promise<string[]> {
    const missedTasks = await this.taskModel.find({
      userId,
      type: 'fard',
      isCompleted: false,
      date: { $lt: dayjs().format('YYYY-MM-DD') },
    });

    const uniqueDates = Array.from(
      new Set(missedTasks.map((task) => task.date)),
    );

    return uniqueDates;
  }

  // Получить задачи на определённую дату
  async getTasksByDate(userId: string, date: string) {
    return this.taskModel.find({
      userId,
      date,
      type: 'fard',
    });
  }

  // Отметить задачу на старую дату как выполненную
  async completeMissedTask(taskId: string, userId: string) {
    const task = await this.taskModel.findOne({ _id: taskId, userId });
    if (!task || task.type !== 'fard') return null;
    task.isCompleted = true;
    return task.save();
  }

  // Получить список всех дат, где все 5 фард-намазов выполнены
  async getCompletedDates(userId: string): Promise<string[]> {
    const tasks = await this.taskModel.find({
      userId,
      type: 'fard',
    });

    const dateMap = new Map<string, { total: number; completed: number }>();

    tasks.forEach((task) => {
      if (!dateMap.has(task.date)) {
        dateMap.set(task.date, { total: 0, completed: 0 });
      }
      const stats = dateMap.get(task.date)!;
      stats.total += 1;
      if (task.isCompleted) stats.completed += 1;
    });

    const completedDates: string[] = [];
    dateMap.forEach((stats, date) => {
      if (stats.total === 5 && stats.completed === 5) {
        completedDates.push(date);
      }
    });

    return completedDates;
  }
}
