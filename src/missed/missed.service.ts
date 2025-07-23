import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Task, TaskDocument } from '../task/schemas/task.schema';
import { Model } from 'mongoose';
import * as dayjs from 'dayjs';

@Injectable()
export class MissedService {
  constructor(@InjectModel(Task.name) private taskModel: Model<TaskDocument>) {}

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
}
