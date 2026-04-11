import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseAdminService {
    private readonly logger = new Logger(FirebaseAdminService.name);
    private app: admin.app.App | null = null;

    constructor(private configService: ConfigService) {
        this.initializeApp();
    }

    private initializeApp() {
        const serviceAccountJson = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON', '');

        if (!serviceAccountJson || serviceAccountJson === 'REPLACE_ME') {
            this.logger.warn(
                '[Firebase] FIREBASE_SERVICE_ACCOUNT_JSON not set — ' +
                'Firebase token verification disabled (DEV MODE: backend trusts phone number directly)'
            );
            return;
        }

        try {
            // Avoid re-initializing if already done (module hot-reload)
            if (admin.apps.length > 0) {
                this.app = admin.apps[0]!;
                this.logger.log('[Firebase] Reusing existing Firebase Admin app');
                return;
            }

            const serviceAccount = JSON.parse(serviceAccountJson);
            this.app = admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            this.logger.log('[Firebase] Admin SDK initialized successfully');
        } catch (err: any) {
            this.logger.error(`[Firebase] Failed to initialize Admin SDK: ${err.message}`);
        }
    }

    /**
     * Verifies a Firebase ID token and returns the decoded token.
     * The `phone_number` field in the decoded token is the user's phone (E.164 format, e.g. +917722097528).
     *
     * In DEV MODE (no service account configured), returns a mock decoded token
     * trusting the phone number directly from the client — ONLY for local development.
     */
    async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
        if (!this.app) {
            // DEV MODE — parse the token without verification to get phone number
            // WARNING: This is insecure and must never be used in production
            this.logger.warn('[Firebase] DEV MODE: Skipping token verification — trusting client claims');
            try {
                const [, payload] = idToken.split('.');
                const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
                if (!decoded.phone_number) {
                    throw new UnauthorizedException('Token missing phone_number claim');
                }
                return decoded as admin.auth.DecodedIdToken;
            } catch {
                throw new UnauthorizedException('Invalid Firebase ID token format');
            }
        }

        try {
            const decoded = await this.app.auth().verifyIdToken(idToken, true /* checkRevoked */);
            if (!decoded.phone_number) {
                throw new UnauthorizedException('Firebase token does not contain a phone number');
            }
            return decoded;
        } catch (err: any) {
            this.logger.error(`[Firebase] Token verification failed: ${err.message}`);
            throw new UnauthorizedException('Invalid or expired Firebase ID token');
        }
    }

    isConfigured(): boolean {
        return this.app !== null;
    }

    /**
     * Look up a Firebase user by phone number (E.164 format).
     * Returns null if not found or Firebase is not configured.
     */
    async getUserByPhoneNumber(phoneNumber: string): Promise<admin.auth.UserRecord | null> {
        if (!this.app) return null;
        try {
            return await this.app.auth().getUserByPhoneNumber(phoneNumber);
        } catch {
            return null;
        }
    }

    /**
     * Delete a Firebase Auth user by UID.
     */
    async deleteUser(uid: string): Promise<void> {
        if (!this.app) return;
        await this.app.auth().deleteUser(uid);
    }
}
