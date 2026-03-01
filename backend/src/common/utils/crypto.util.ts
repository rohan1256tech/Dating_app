import * as crypto from 'crypto';

/**
 * Generate a secure random OTP of specified length
 */
export function generateOTP(length: number = 6): string {
    const digits = '0123456789';
    let otp = '';

    const randomBytes = crypto.randomBytes(length);

    for (let i = 0; i < length; i++) {
        const randomIndex = randomBytes[i] % digits.length;
        otp += digits[randomIndex];
    }

    return otp;
}

/**
 * Hash a value using SHA256
 */
export function hashValue(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
}

/**
 * Compare hashed value with plain value
 */
export function compareHash(plain: string, hashed: string): boolean {
    const plainHashed = hashValue(plain);
    return plainHashed === hashed;
}
