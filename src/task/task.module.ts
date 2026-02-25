import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Task, TaskSchema } from './schemas/task.schema';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { TaskScheduler } from './task.scheduler';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Task.name, schema: TaskSchema }]),
    UsersModule,
  ],
  controllers: [TaskController],
  providers: [TaskService, TaskScheduler],
  exports: [MongooseModule, TaskService],
})
export class TaskModule { }
