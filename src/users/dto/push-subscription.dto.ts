import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsObject } from 'class-validator';

export class AddPushSubscriptionDto {
    @ApiProperty({
        example: 'https://fcm.googleapis.com/fcm/send/...',
        description: 'Endpoint для push уведомлений',
    })
    @IsString()
    @IsNotEmpty()
    endpoint: string;

    @ApiProperty({
        example: {
            p256dh: 'BNcRd...',
            auth: 'tBHI...',
        },
        description: 'Ключи шифрования для push уведомлений',
    })
    @IsObject()
    keys: {
        p256dh: string;
        auth: string;
    };
}

export class RemovePushSubscriptionDto {
    @ApiProperty({
        example: 'https://fcm.googleapis.com/fcm/send/...',
        description: 'Endpoint подписки для удаления',
    })
    @IsString()
    @IsNotEmpty()
    endpoint: string;
}
