import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AchievementsService } from './achievements.service';
import { UserRequest } from 'src/types/interfaces/user-request.interface';

@UseGuards(AuthGuard('jwt'))
@Controller('achievements')
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get()
  getOverview(@Request() req: UserRequest) {
    return this.achievementsService.getOverview(req.user.userId);
  }
}
