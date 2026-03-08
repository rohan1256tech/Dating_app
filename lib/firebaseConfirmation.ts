/**
 * Singleton ref to hold the Firebase ConfirmationResult between
 * the Login screen (where signInWithPhoneNumber is called) and the
 * OTP Verification screen (where confirm(otp) is called).
 *
 * We can't pass class instances through Expo Router params (only serializable
 * primitives), so we store it here and access it from either screen.
 */
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';

let _confirmationResult: FirebaseAuthTypes.ConfirmationResult | null = null;

export const firebaseConfirmation = {
    set(result: FirebaseAuthTypes.ConfirmationResult) {
        _confirmationResult = result;
    },
    get(): FirebaseAuthTypes.ConfirmationResult | null {
        return _confirmationResult;
    },
    clear() {
        _confirmationResult = null;
    },
};
