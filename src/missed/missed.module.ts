import { Module } from '@nestjs/common';
import { MissedController } from './missed.controller';
import { MissedService } from './missed.service';
import { TaskModule } from 'src/task/task.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [TaskModule, UsersModule],
  controllers: [MissedController],
  providers: [MissedService],
})
export class MissedModule {}
