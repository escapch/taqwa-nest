import { Body, Controller, Get, Logger, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
    private readonly logger = new Logger(NotificationsController.name);

    constructor(private readonly notificationsService: NotificationsService) { }

    @Get('vapid-public-key')
    getVapidPublicKey() {
        return {
            publicKey: this.notificationsService.getVapidPublicKey(),
        };
    }
    @Post('subscribe')
    @UseGuards(AuthGuard('jwt'))
    async subscribe(@Body() dto: CreateSubscriptionDto, @Req() req: any) {
        // Robust userId extraction to support different JWT payloads
        // JwtStrategy returns { userId, email }, so we check userId first
        const userId = req.user.userId || req.user.id || req.user._id || req.user.sub;

        if (!userId || userId === 'undefined') {
            this.logger.warn(
                `Failed push subscription: userId is missing in request. User object: ${JSON.stringify(req.user)}`,
            );
            throw new Error('User ID not found in token');
        }

        await this.notificationsService.saveSubscription(userId, dto);
        return { success: true };
    }

    @Get('test-my-push')
    @UseGuards(AuthGuard('jwt'))
    async testPush(@Req() req: any) {
        const userId = req.user.id || req.user._id || req.user.sub;
        const subs = await this.notificationsService.getUserSubscriptions(userId);

        for (const sub of subs) {
            await this.notificationsService.sendPushNotification(sub, {
                title: 'Ура!',
                body: 'Пуши работают! 🎉',
            });
        }
        return { success: true, count: subs.length };
    }

    @Get('debug-all')
    @UseGuards(AuthGuard('jwt'))
    async debugAll() {
        const all = await this.notificationsService.getAllSubscriptions();
        return {
            total: all.length,
            items: all.map(i => ({
                id: i._id,
                userId: i.userId,
                endpointSnippet: i.endpoint.substring(0, 30) + '...'
            }))
        };
    }

    @Get('test-broadcast')
    @UseGuards(AuthGuard('jwt'))
    async testBroadcast() {
        const all = await this.notificationsService.getAllSubscriptions();
        let successCount = 0;
        for (const sub of all) {
            const ok = await this.notificationsService.sendPushNotification(sub, {
                title: 'Общая проверка',
                body: 'Это уведомление для всех! 🎉',
            });
            if (ok) successCount++;
        }
        return { success: true, sentTo: all.length, successful: successCount };
    }

    @Post('debug-clear-all')
    @UseGuards(AuthGuard('jwt'))
    async clearAll() {
        await this.notificationsService.deleteAllSubscriptions();
        return { success: true, message: 'All subscriptions cleared' };
    }
}

