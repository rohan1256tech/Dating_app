import { IsIn, IsOptional, IsString } from 'class-validator';

export class CreateOrderDto {
    @IsString()
    @IsIn(['monthly', 'quarterly', 'annual'])
    planId: 'monthly' | 'quarterly' | 'annual';
}

export class VerifyPaymentDto {
    @IsString()
    razorpayOrderId: string;

    @IsString()
    razorpayPaymentId: string;

    @IsString()
    razorpaySignature: string;

    @IsString()
    @IsOptional()
    planId?: string;
}

export class LegacyWebhookDto {
    @IsString()
    userId: string;

    @IsString()
    @IsIn(['PREMIUM', 'FREE'])
    plan: 'PREMIUM' | 'FREE';

    @IsOptional()
    durationDays?: number;
}

/** Google Play Billing — sent by frontend after purchaseUpdatedListener fires */
export class VerifyIAPDto {
    @IsString()
    purchaseToken: string;  // The token from Google Play purchase object

    @IsString()
    productId: string;      // e.g. "whatsleft_premium_monthly"

    @IsString()
    packageName: string;    // e.g. "com.yourname.whatsleft"
}
