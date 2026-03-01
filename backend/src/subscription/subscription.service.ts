import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    Logger,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as crypto from 'crypto';
import { google } from 'googleapis';
import { Model } from 'mongoose';
import Razorpay from 'razorpay';
import { User, UserDocument } from '../users/user.schema';

/** Maps plan label → price in paise (INR × 100) */
const PLAN_PRICES: Record<string, { amountPaise: number; durationDays: number }> = {
    monthly: { amountPaise: 4900, durationDays: 30 },   // ₹49/month
    quarterly: { amountPaise: 13900, durationDays: 90 },   // ₹139/3 months
    annual: { amountPaise: 49900, durationDays: 365 },  // ₹499/year
};

@Injectable()
export class SubscriptionService {
    private readonly logger = new Logger(SubscriptionService.name);
    private readonly razorpay: Razorpay;

    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        private configService: ConfigService,
    ) {
        this.razorpay = new Razorpay({
            key_id: this.configService.get<string>('RAZORPAY_KEY_ID', ''),
            key_secret: this.configService.get<string>('RAZORPAY_KEY_SECRET', ''),
        });
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    // ── Google Play Billing ────────────────────────────────────────────────────

    /**
     * Verifies a Google Play purchase token server-side using the
     * Google Play Developer API, then grants PREMIUM to the user.
     *
     * Setup required (one-time):
     * 1. Google Cloud Console → IAM → Service Accounts → create one
     * 2. Grant it "Google Play Developer" role in Play Console → Setup → API access
     * 3. Create JSON key → download → set GOOGLE_PLAY_SERVICE_ACCOUNT_JSON env var
     *    (paste the entire JSON as a single-line string, or set GOOGLE_PLAY_KEY_FILE path)
     */
    async verifyGooglePlayPurchase(
        userId: string,
        purchaseToken: string,
        productId: string,
        packageName: string,
    ): Promise<{ success: boolean; plan: string; expiresAt: Date }> {
        // ── 1. Build authenticated API client ────────────────────────────────
        const serviceAccountJson = this.configService.get<string>('GOOGLE_PLAY_SERVICE_ACCOUNT_JSON', '');

        if (!serviceAccountJson) {
            this.logger.warn('GOOGLE_PLAY_SERVICE_ACCOUNT_JSON not set — granting premium without Play verification (DEV MODE)');
            // Dev mode: trust the frontend, grant premium immediately
            const plan = this.getPlanFromProductId(productId);
            const { durationDays } = PLAN_PRICES[plan] ?? PLAN_PRICES.monthly;
            return this.upgradeToPremium(userId, durationDays) as any;
        }

        try {
            const credentials = JSON.parse(serviceAccountJson);
            const auth = new google.auth.GoogleAuth({
                credentials,
                scopes: ['https://www.googleapis.com/auth/androidpublisher'],
            });

            const androidPublisher = google.androidpublisher({ version: 'v3', auth });

            // ── 2. Call Google Play API to verify token ──────────────────────
            const response = await androidPublisher.purchases.subscriptions.get({
                packageName,
                subscriptionId: productId,
                token: purchaseToken,
            });

            const purchase = response.data;

            // ── 3. Validate purchase state ───────────────────────────────────
            // paymentState: 0=pending, 1=received, 2=free trial, 3=deferred
            if (purchase.paymentState !== 1 && purchase.paymentState !== 2) {
                throw new BadRequestException('Purchase payment not completed');
            }

            // cancelReason: defined only if cancelled
            if (purchase.cancelReason !== undefined && purchase.cancelReason !== null) {
                throw new BadRequestException('Subscription was cancelled');
            }

            this.logger.log(`[IAP] Purchase verified for user ${userId}: ${productId}`);

            // ── 4. Grant premium based on plan duration ──────────────────────
            const plan = this.getPlanFromProductId(productId);
            const { durationDays } = PLAN_PRICES[plan] ?? PLAN_PRICES.monthly;
            return this.upgradeToPremium(userId, durationDays) as any;

        } catch (err: any) {
            this.logger.error(`[IAP] Verification failed: ${err.message}`);
            throw new BadRequestException(`Purchase verification failed: ${err.message}`);
        }
    }

    /** Maps Play Store productId to internal plan key */
    private getPlanFromProductId(productId: string): string {
        if (productId.includes('annual')) return 'annual';
        if (productId.includes('quarterly')) return 'quarterly';
        return 'monthly';
    }

    async getUser(userId: string): Promise<UserDocument> {
        const user = await this.userModel.findById(userId).exec();
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    async isPremium(userId: string): Promise<boolean> {
        const user = await this.userModel.findById(userId).select('subscription').exec();
        if (!user) return false;
        const { plan, expiresAt } = user.subscription ?? {};
        if (plan !== 'PREMIUM') return false;
        if (expiresAt && new Date() > new Date(expiresAt)) return false;
        return true;
    }

    async isBoostActive(userId: string): Promise<boolean> {
        const user = await this.userModel.findById(userId).select('boost').exec();
        if (!user) return false;
        const { isActive, expiresAt } = user.boost ?? {};
        if (!isActive) return false;
        if (expiresAt && new Date() > new Date(expiresAt)) return false;
        return true;
    }

    // ── Subscription status ────────────────────────────────────────────────────

    async getSubscription(userId: string) {
        const user = await this.userModel
            .findById(userId)
            .select('subscription boost swipeStats')
            .exec();
        if (!user) throw new NotFoundException('User not found');

        const { plan, expiresAt } = user.subscription ?? {};
        const isPremium =
            plan === 'PREMIUM' && (!expiresAt || new Date() < new Date(expiresAt));

        return {
            plan: isPremium ? 'PREMIUM' : 'FREE',
            expiresAt: expiresAt ?? null,
            isPremium,
            boost: {
                isActive:
                    user.boost?.isActive === true &&
                    (!user.boost?.expiresAt || new Date() < new Date(user.boost.expiresAt)),
                expiresAt: user.boost?.expiresAt ?? null,
            },
            swipesRemaining: isPremium
                ? null
                : Math.max(0, 10 - (user.swipeStats?.swipesToday ?? 0)),
        };
    }

    async upgradeToPremium(userId: string, durationDays: number) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + durationDays);

        await this.userModel.findByIdAndUpdate(userId, {
            $set: {
                'subscription.plan': 'PREMIUM',
                'subscription.expiresAt': expiresAt,
            },
        });

        this.logger.log(`User ${userId} upgraded to PREMIUM for ${durationDays} days`);
        return { success: true, plan: 'PREMIUM', expiresAt };
    }

    async downgradeToFree(userId: string) {
        await this.userModel.findByIdAndUpdate(userId, {
            $set: {
                'subscription.plan': 'FREE',
                'subscription.expiresAt': null,
                'boost.isActive': false,
                'boost.expiresAt': null,
            },
        });
        this.logger.log(`User ${userId} downgraded to FREE`);
        return { success: true, plan: 'FREE' };
    }

    // ── Razorpay — create order ────────────────────────────────────────────────

    async createRazorpayOrder(userId: string, planId: string) {
        const plan = PLAN_PRICES[planId];
        if (!plan) throw new BadRequestException(`Unknown plan: ${planId}`);

        const merchantName = this.configService.get<string>('MERCHANT_NAME', 'Detto');
        const keyId = this.configService.get<string>('RAZORPAY_KEY_ID', '');

        if (!keyId || keyId === 'rzp_test_REPLACE_ME') {
            throw new BadRequestException(
                'Razorpay is not configured. Add your RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to backend/.env'
            );
        }

        const order = await this.razorpay.orders.create({
            amount: plan.amountPaise,
            currency: 'INR',
            // receipt must be ≤40 chars
            receipt: `rzp_${planId[0]}${userId.slice(-8)}_${Date.now().toString(36)}`,
            notes: { userId, planId, durationDays: plan.durationDays.toString() },
        });

        this.logger.log(`Created Razorpay order ${order.id} for user ${userId} plan ${planId}`);

        return {
            orderId: order.id,
            amount: plan.amountPaise,
            currency: 'INR',
            keyId,
            merchantName,
            planId,
            durationDays: plan.durationDays,
            description: `Detto Premium — ${planId.charAt(0).toUpperCase() + planId.slice(1)}`,
        };
    }

    // ── Razorpay — verify payment (frontend confirmation) ─────────────────────

    async verifyPayment(
        userId: string,
        razorpayOrderId: string,
        razorpayPaymentId: string,
        razorpaySignature: string,
        planId: string,
    ) {
        const secret = this.configService.get<string>('RAZORPAY_KEY_SECRET', '');
        const body = `${razorpayOrderId}|${razorpayPaymentId}`;
        const expectedSig = crypto
            .createHmac('sha256', secret)
            .update(body)
            .digest('hex');

        if (expectedSig !== razorpaySignature) {
            this.logger.warn(`Invalid payment signature for user ${userId}`);
            throw new UnauthorizedException('Payment verification failed — invalid signature');
        }

        const plan = PLAN_PRICES[planId] ?? PLAN_PRICES['monthly'];
        await this.upgradeToPremium(userId, plan.durationDays);

        this.logger.log(
            `✅ Payment verified for user ${userId}: paymentId=${razorpayPaymentId}`,
        );

        return {
            success: true,
            paymentId: razorpayPaymentId,
            plan: 'PREMIUM',
            durationDays: plan.durationDays,
        };
    }

    // ── Razorpay webhook ───────────────────────────────────────────────────────

    async handleRazorpayWebhook(rawBody: string, signature: string) {
        const webhookSecret = this.configService.get<string>('RAZORPAY_WEBHOOK_SECRET', '');
        const expectedSig = crypto
            .createHmac('sha256', webhookSecret)
            .update(rawBody)
            .digest('hex');

        if (expectedSig !== signature) {
            throw new UnauthorizedException('Invalid Razorpay webhook signature');
        }

        const event = JSON.parse(rawBody);

        if (event.event === 'payment.captured') {
            const payment = event.payload?.payment?.entity;
            const userId = payment?.notes?.userId;
            const planId = payment?.notes?.planId;
            const days = parseInt(payment?.notes?.durationDays ?? '30', 10);

            if (userId) {
                await this.upgradeToPremium(userId, days);
                this.logger.log(
                    `Webhook: upgraded ${userId} to PREMIUM via payment ${payment.id}`,
                );
            } else {
                this.logger.warn('Razorpay webhook: missing userId in notes', payment);
            }
        }

        return { received: true };
    }

    // ── Boost ──────────────────────────────────────────────────────────────────

    async activateBoost(userId: string) {
        const premium = await this.isPremium(userId);
        if (!premium) {
            throw new ForbiddenException({
                errorCode: 'PREMIUM_REQUIRED',
                message: 'Boost is a PREMIUM feature. Upgrade to unlock.',
            });
        }

        const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
        await this.userModel.findByIdAndUpdate(userId, {
            $set: { 'boost.isActive': true, 'boost.expiresAt': expiresAt },
        });

        this.logger.log(`Boost activated for user ${userId} until ${expiresAt}`);
        return { success: true, expiresAt };
    }

    // ── Cron — downgrade expired subscriptions ────────────────────────────────

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handleExpiredSubscriptions() {
        this.logger.log('Running expired subscription cleanup...');
        const now = new Date();

        const subResult = await this.userModel.updateMany(
            { 'subscription.plan': 'PREMIUM', 'subscription.expiresAt': { $lt: now } },
            { $set: { 'subscription.plan': 'FREE', 'boost.isActive': false, 'boost.expiresAt': null } },
        );

        const boostResult = await this.userModel.updateMany(
            { 'boost.isActive': true, 'boost.expiresAt': { $lt: now } },
            { $set: { 'boost.isActive': false } },
        );

        this.logger.log(
            `Expired subscriptions: ${subResult.modifiedCount}, boosts deactivated: ${boostResult.modifiedCount}`,
        );
    }
}
