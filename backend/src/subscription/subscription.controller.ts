import {
    Body,
    Controller,
    Get,
    Headers,
    HttpCode,
    HttpStatus,
    Post,
    Req,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LegacyWebhookDto, VerifyIAPDto } from './subscription.dto';
import { SubscriptionService } from './subscription.service';

@Controller()
export class SubscriptionController {
    constructor(private readonly subscriptionService: SubscriptionService) { }

    // ── GET /subscription/status ──────────────────────────────────────────────

    @Get('subscription/status')
    @UseGuards(JwtAuthGuard)
    async getStatus(@Req() req: any) {
        return this.subscriptionService.getSubscription(req.user.userId);
    }

    // ── POST /payment/verify-iap ─────────────────────────────────────────────
    // Primary payment endpoint — called by the app after Google Play purchase.
    // Verifies purchaseToken with Google Play Developer API, grants PREMIUM.

    @Post('payment/verify-iap')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    async verifyIAP(@Req() req: any, @Body() body: VerifyIAPDto) {
        return this.subscriptionService.verifyGooglePlayPurchase(
            req.user.userId,
            body.purchaseToken,
            body.productId,
            body.packageName,
        );
    }

    // ── POST /subscription/webhook (legacy dev webhook) ───────────────────────

    @Post('subscription/webhook')
    @HttpCode(HttpStatus.OK)
    async legacyWebhook(
        @Headers('x-webhook-secret') secret: string,
        @Body() body: LegacyWebhookDto,
    ) {
        const expectedSecret = process.env.WEBHOOK_SECRET ?? 'whatsleft-webhook-secret';
        if (secret !== expectedSecret) {
            return { error: 'Invalid webhook secret' };
        }
        const { userId, plan, durationDays = 30 } = body;
        if (plan === 'PREMIUM') {
            return this.subscriptionService.upgradeToPremium(userId, durationDays);
        }
        return this.subscriptionService.downgradeToFree(userId);
    }

    // ── POST /boost/activate ──────────────────────────────────────────────────

    @Post('boost/activate')
    @UseGuards(JwtAuthGuard)
    async activateBoost(@Req() req: any) {
        return this.subscriptionService.activateBoost(req.user.userId);
    }
}
