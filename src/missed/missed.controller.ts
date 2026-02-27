import {
  Controller,
  Get,
  Param,
  Patch,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MissedService } from './missed.service';
import { UserRequest } from 'src/types/interfaces/user-request.interface';

@UseGuards(AuthGuard('jwt'))
@Controller('missed')
export class MissedController {
  constructor(private missedService: MissedService) { }

  @Get('dates')
  getMissedDates(@Request() req: UserRequest) {
    return this.missedService.getMissedDates(req.user.userId);
  }

  @Get(':date')
  getTasksByDate(@Request() req: UserRequest, @Param('date') date: string) {
    return this.missedService.getTasksByDate(req.user.userId, date);
  }

  @Get('completed-dates')
  getCompletedDates(@Request() req: UserRequest) {
    return this.missedService.getCompletedDates(req.user.userId);
  }

  @Patch(':id/complete')
  completeMissedTask(@Request() req: UserRequest, @Param('id') id: string) {
    return this.missedService.completeMissedTask(id, req.user.userId);
  }
}
