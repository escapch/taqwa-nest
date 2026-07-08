import { Module } from '@nestjs/common';
import { AchievementsController } from './achievements.controller';
import { AchievementsService } from './achievements.service';
import { TaskModule } from '../task/task.module';
import { UsersModule } from '../users/users.module';
import { QuotesModule } from '../quotes/quotes.module';

@Module({
  imports: [TaskModule, UsersModule, QuotesModule],
  controllers: [AchievementsController],
  providers: [AchievementsService],
})
export class AchievementsModule {}
