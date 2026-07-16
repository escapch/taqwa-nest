import { IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class SubscriptionKeysDto {
    @IsString()
    @IsNotEmpty()
    p256dh: string;

    @IsString()
    @IsNotEmpty()
    auth: string;
}

export class CreateSubscriptionDto {
    @IsString()
    @IsNotEmpty()
    endpoint: string;

    @IsObject()
    @ValidateNested()
    @Type(() => SubscriptionKeysDto)
    keys: SubscriptionKeysDto;

    @IsOptional()
    @IsNumber()
    expirationTime?: number | null;
}
