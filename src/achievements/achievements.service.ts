import { Injectable } from '@nestjs/common';
import { TaskService } from '../task/task.service';
import { UsersService } from '../users/users.service';
import { QuoteService } from '../quotes/quotes.service';
import { ACHIEVEMENTS, XP_PER_LEVEL } from './achievements.constants';

@Injectable()
export class AchievementsService {
  constructor(
    private readonly taskService: TaskService,
    private readonly usersService: UsersService,
    private readonly quoteService: QuoteService,
  ) {}

  async getOverview(userId: string) {
    const [stats, user] = await Promise.all([
      this.taskService.getLifetimeStats(userId),
      this.usersService.findById(userId),
    ]);

    const unlockedKeys = new Set(
      (user?.unlockedAchievements ?? []).map((a) => a.key),
    );
    const unlockedAtByKey = new Map(
      (user?.unlockedAchievements ?? []).map((a) => [a.key, a.unlockedAt]),
    );

    const newlyUnlockedDefs = ACHIEVEMENTS.filter(
      (def) => !unlockedKeys.has(def.key) && def.check(stats),
    );

    if (newlyUnlockedDefs.length > 0) {
      const now = new Date();
      await this.usersService.addUnlockedAchievements(
        userId,
        newlyUnlockedDefs.map((def) => ({ key: def.key, unlockedAt: now })),
      );
      newlyUnlockedDefs.forEach((def) => {
        unlockedKeys.add(def.key);
        unlockedAtByKey.set(def.key, now);
      });
    }

    const achievements = ACHIEVEMENTS.map((def) => ({
      key: def.key,
      title: def.title,
      description: def.description,
      unlocked: unlockedKeys.has(def.key),
      unlockedAt: unlockedAtByKey.get(def.key) ?? null,
    }));

    const newlyUnlocked = await Promise.all(
      newlyUnlockedDefs.map(async (def) => ({
        key: def.key,
        title: def.title,
        description: def.description,
        quote: await this.quoteService.getRandomByCategory(def.quoteCategory),
      })),
    );

    const level = Math.floor(stats.completedFards / XP_PER_LEVEL) + 1;
    const xp = stats.completedFards % XP_PER_LEVEL;

    return {
      level,
      xp,
      xpToNextLevel: XP_PER_LEVEL,
      achievements,
      newlyUnlocked,
    };
  }
}
