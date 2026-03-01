/**
 * Validate phone number format
 * Accepts formats like: +919876543210, +1234567890
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
    // International format: + followed by 1-3 digit country code and 6-14 digits
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
}
