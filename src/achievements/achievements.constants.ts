export interface LifetimeStats {
  currentStreak: number;
  bestStreak: number;
  completedFards: number;
  hasPerfectMonth: boolean;
}

export interface AchievementDef {
  key: string;
  title: string;
  description: string;
  quoteCategory?: string;
  check: (stats: LifetimeStats) => boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    key: 'first_prayer',
    title: 'Первый шаг',
    description: 'Выполните свой первый намаз',
    quoteCategory: 'milestone',
    check: (s) => s.completedFards >= 1,
  },
  {
    key: 'streak_3',
    title: '3 дня подряд',
    description: 'Выполняйте все намазы 3 дня подряд',
    quoteCategory: 'streak',
    check: (s) => s.bestStreak >= 3,
  },
  {
    key: 'streak_7',
    title: 'Неделя стабильности',
    description: 'Выполняйте все намазы 7 дней подряд',
    quoteCategory: 'streak',
    check: (s) => s.bestStreak >= 7,
  },
  {
    key: 'streak_30',
    title: 'Месяц дисциплины',
    description: 'Выполняйте все намазы 30 дней подряд',
    quoteCategory: 'streak',
    check: (s) => s.bestStreak >= 30,
  },
  {
    key: 'streak_100',
    title: '100 дней подряд',
    description: 'Выполняйте все намазы 100 дней подряд',
    quoteCategory: 'streak',
    check: (s) => s.bestStreak >= 100,
  },
  {
    key: 'fards_100',
    title: '100 намазов',
    description: 'Выполните 100 намазов',
    quoteCategory: 'milestone',
    check: (s) => s.completedFards >= 100,
  },
  {
    key: 'fards_500',
    title: '500 намазов',
    description: 'Выполните 500 намазов',
    quoteCategory: 'milestone',
    check: (s) => s.completedFards >= 500,
  },
  {
    key: 'fards_1000',
    title: '1000 намазов',
    description: 'Выполните 1000 намазов',
    quoteCategory: 'milestone',
    check: (s) => s.completedFards >= 1000,
  },
  {
    key: 'perfect_month',
    title: 'Идеальный месяц',
    description: 'Завершите календарный месяц со 100% выполнением',
    quoteCategory: 'milestone',
    check: (s) => s.hasPerfectMonth,
  },
];

export const XP_PER_LEVEL = 50;
