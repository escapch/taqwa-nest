import {
    Controller,
    Get,
    Query,
    UseGuards,
    Request,
    BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOkResponse, ApiQuery } from '@nestjs/swagger';
import { PrayerTimesService } from './prayer-times.service';
import { UserRequest } from 'src/types/interfaces/user-request.interface';
import { UsersService } from 'src/users/users.service';

@ApiTags('Prayer Times')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('prayer-times')
export class PrayerTimesController {
    constructor(
        private readonly prayerTimesService: PrayerTimesService,
        private readonly usersService: UsersService,
    ) { }

    @Get('today')
    @ApiOkResponse({
        description: 'Получить время намазов на сегодня для текущего пользователя',
    })
    async getTodayPrayerTimes(@Request() req: UserRequest) {
        const user = await this.usersService.findById(req.user.userId);

        if (!user || !user.location) {
            throw new BadRequestException(
                'User location is not set. Please update your location first.',
            );
        }

        return this.prayerTimesService.getTodayPrayerTimes(
            user.location.latitude,
            user.location.longitude,
            user.timezone,
        );
    }

    @Get()
    @ApiQuery({ name: 'date', required: true, example: '2026-02-10' })
    @ApiQuery({ name: 'lat', required: true, example: '43.238293' })
    @ApiQuery({ name: 'lng', required: true, example: '76.945465' })
    @ApiQuery({ name: 'timezone', required: false, example: 'Asia/Almaty' })
    @ApiOkResponse({
        description: 'Получить время намазов для конкретной даты и локации',
    })
    async getPrayerTimes(
        @Query('date') date: string,
        @Query('lat') lat: string,
        @Query('lng') lng: string,
        @Query('timezone') tz?: string,
    ) {
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        const timezone = tz || 'UTC';

        if (isNaN(latitude) || isNaN(longitude)) {
            throw new BadRequestException('Invalid latitude or longitude');
        }

        return this.prayerTimesService.getPrayerTimes(
            date,
            latitude,
            longitude,
            timezone,
        );
    }
}
