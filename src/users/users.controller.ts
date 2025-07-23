import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UserRequest } from 'src/types/interfaces/user-request.interface';
import { ProfileResponseDto } from './dto/profile.dto';

@ApiTags('Profile')
@ApiBearerAuth()
@Controller('profile')
export class UsersController {
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  @ApiOkResponse({
    type: ProfileResponseDto,
    description: 'Успешно получен профиль пользователя',
  })
  getMe(@Request() req: UserRequest): ProfileResponseDto {
    return req.user;
  }
}
