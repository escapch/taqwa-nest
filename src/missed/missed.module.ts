import { Module } from '@nestjs/common';
import { MissedController } from './missed.controller';
import { MissedService } from './missed.service';
import { TaskModule } from 'src/task/task.module';

@Module({
  imports: [TaskModule],
  controllers: [MissedController],
  providers: [MissedService],
})
export class MissedModule {}
