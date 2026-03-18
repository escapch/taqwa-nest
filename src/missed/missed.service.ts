import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Task, TaskDocument } from '../task/schemas/task.schema';
import { Model } from 'mongoose';
import * as dayjs from 'dayjs';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class MissedService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    private usersService: UsersService,
  ) { }

  async getOverview(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) return [];

    const stats = await this.taskModel.aggregate([
      {
        $match: {
          userId,
          type: 'fard',
        },
      },
      {
        $group: {
          _id: '$date',
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$isCompleted', true] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const statsMap = new Map(
      stats.map((s) => [s._id, { total: s.total, completed: s.completed }]),
    );

    const overview: { date: string; status: 'completed' | 'missed' | 'partial' }[] = [];
    const startDate = dayjs(user.registeredAt);
    const today = dayjs();

    let current = startDate;
    while (current.isBefore(today, 'day') || current.isSame(today, 'day')) {
      const dateStr = current.format('YYYY-MM-DD');
      const dayStats = statsMap.get(dateStr);
      const isToday = current.isSame(today, 'day');

      let status: 'completed' | 'missed' | 'partial' | null = 'missed';

      if (dayStats) {
        if (dayStats.completed === 5) status = 'completed';
        else if (dayStats.completed > 0) status = 'partial';
        else if (isToday) status = null; // Не отмечаем сегодняшний день как пропущенный, если 0 выполнено
      } else if (isToday) {
        status = null; // Если записей за сегодня ещё нет, не отмечаем как пропущенный
      }

      if (status) {
        overview.push({ date: dateStr, status });
      }
      current = current.add(1, 'day');
    }

    return overview;
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
