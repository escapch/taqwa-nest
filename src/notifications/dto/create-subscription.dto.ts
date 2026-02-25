export class SubscriptionKeysDto {
    p256dh: string;
    auth: string;
}

export class CreateSubscriptionDto {
    endpoint: string;
    keys: SubscriptionKeysDto;
    expirationTime?: number | null;
}
