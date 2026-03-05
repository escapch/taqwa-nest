import {
  Controller,
  Get,
  UseGuards,
  Request,
  Patch,
  Body,
  Post,
  Delete,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UserRequest } from 'src/types/interfaces/user-request.interface';
import { ProfileResponseDto } from './dto/profile.dto';
import { UsersService } from './users.service';
import { UpdateLocationDto } from './dto/update-location.dto';
import {
  AddPushSubscriptionDto,
  RemovePushSubscriptionDto,
} from './dto/push-subscription.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@ApiTags('Profile')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get('me')
  @ApiOkResponse({
    type: ProfileResponseDto,
    description: 'Успешно получен профиль пользователя',
  })
  async getMe(@Request() req: UserRequest) {
    const user = await this.usersService.findById(req.user.userId);
    if (!user) return null;

    return {
      userId: String(user._id),
      email: user.email,
      name: user.name,
      registeredAt: user.registeredAt,
      timezone: user.timezone,
      location: user.location,
    };
  }

  @Patch('me')
  @ApiOkResponse({
    description: 'Профиль успешно обновлён',
  })
  async updateProfile(
    @Request() req: UserRequest,
    @Body() dto: UpdateProfileDto,
  ) {
    const user = await this.usersService.updateProfile(req.user.userId, dto);
    if (!user) return null;

    return {
      userId: String(user._id),
      email: user.email,
      name: user.name,
      registeredAt: user.registeredAt,
      timezone: user.timezone,
    };
  }

  @Patch('me/password')
  @ApiOkResponse({
    description: 'Пароль успешно изменён',
  })
  async changePassword(
    @Request() req: UserRequest,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.usersService.changePassword(
      req.user.userId,
      dto.currentPassword,
      dto.newPassword,
    );
    return { message: 'Пароль успешно изменён' };
  }

  @Delete('me')
  @ApiOkResponse({
    description: 'Аккаунт успешно удалён',
  })
  async deleteAccount(@Request() req: UserRequest) {
    await this.usersService.deleteAccount(req.user.userId);
    return { message: 'Аккаунт удалён' };
  }

  @Patch('location')
  @ApiOkResponse({
    description: 'Локация успешно обновлена',
  })
  async updateLocation(
    @Request() req: UserRequest,
    @Body() dto: UpdateLocationDto,
  ) {
    return this.usersService.updateLocation(
      req.user.userId,
      dto.latitude,
      dto.longitude,
    );
  }

  @Delete('location')
  @ApiOkResponse({
    description: 'Локация успешно удалена',
  })
  async deleteLocation(@Request() req: UserRequest) {
    return this.usersService.deleteLocation(req.user.userId);
  }

  @Post('push-subscription')
  @ApiOkResponse({
    description: 'Push подписка добавлена',
  })
  async addPushSubscription(
    @Request() req: UserRequest,
    @Body() dto: AddPushSubscriptionDto,
  ) {
    return this.usersService.addPushSubscription(req.user.userId, dto);
  }

  @Delete('push-subscription')
  @ApiOkResponse({
    description: 'Push подписка удалена',
  })
  async removePushSubscription(
    @Request() req: UserRequest,
    @Body() dto: RemovePushSubscriptionDto,
  ) {
    return this.usersService.removePushSubscription(
      req.user.userId,
      dto.endpoint,
    );
  }
}

