import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TaskService, StatsPeriod } from './task.service';
import { AddCustomTaskDto } from './dto/add-custom-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UserRequest } from 'src/types/interfaces/user-request.interface';

const STATS_PERIODS: StatsPeriod[] = ['week', 'month', 'year', 'all'];

@UseGuards(AuthGuard('jwt'))
@Controller('task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Get('today')
  getTodayTasks(@Request() req: UserRequest) {
    return this.taskService.getTodayTasks(req.user.userId);
  }

  @Post('custom')
  addCustomTask(@Request() req: UserRequest, @Body() dto: AddCustomTaskDto) {
    return this.taskService.addCustomTask(req.user.userId, dto.title);
  }

  @Patch(':id/toggle')
  toggleComplete(@Request() req: UserRequest, @Param('id') id: string) {
    return this.taskService.toggleComplete(id, req.user.userId);
  }

  @Delete(':id')
  deleteCustom(@Request() req: UserRequest, @Param('id') id: string) {
    return this.taskService.deleteCustomTask(id, req.user.userId);
  }

  @Put(':id')
  updateCustom(
    @Request() req: UserRequest,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.taskService.updateCustomTask(id, req.user.userId, dto.title);
  }

  @Get('date/:date')
  getTasksByDate(@Request() req: UserRequest, @Param('date') date: string) {
    return this.taskService.getTasksByDate(req.user.userId, date);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('/stats')
  getStats(@Request() req: UserRequest, @Query('period') period?: string) {
    const validPeriod = STATS_PERIODS.includes(period as StatsPeriod)
      ? (period as StatsPeriod)
      : 'all';
    return this.taskService.getStatsOverview(req.user.userId, validPeriod);
  }
}
