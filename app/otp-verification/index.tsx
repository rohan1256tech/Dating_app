import { useApp } from '@/context/AppContext';
import api from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';

// ─── DEV MODE (must match login/index.tsx) ────────────────────────────────────
const DEV_MODE = true;
const DEV_OTP = '123456';
// ─────────────────────────────────────────────────────────────────────────────

const THEME = {
    bg: ['#0f0c29', '#302b63', '#24243e'] as const,
    accent: '#FF6B6B',
    accentAlt: '#FF8E53',
    white: '#FFFFFF',
    muted: 'rgba(255,255,255,0.55)',
    card: 'rgba(255,255,255,0.07)',
    border: 'rgba(255,255,255,0.12)',
};

export default function OtpVerificationScreen() {
    const router = useRouter();
    const { fetchUserProfile } = useApp();
    const params = useLocalSearchParams<{ phoneNumber?: string; devMode?: string }>();
    const phoneNumber = params.phoneNumber || '';
    const isDevMode = DEV_MODE || params.devMode === '1';

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [timer, setTimer] = useState(30);
    const [isTimerRunning, setIsTimerRunning] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const inputRefs = useRef<(TextInput | null)[]>([]);

    const otpValue = otp.join('');

    useEffect(() => {
        let interval: any;
        if (isTimerRunning && timer > 0) {
            interval = setInterval(() => setTimer(p => p - 1), 1000);
        } else if (timer === 0) {
            setIsTimerRunning(false);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning, timer]);

    const handleOtpChange = (text: string, index: number) => {
        const digit = text.replace(/[^0-9]/g, '').slice(-1);
        const newOtp = [...otp];
        newOtp[index] = digit;
        setOtp(newOtp);
        setError('');
        if (digit && index < 5) inputRefs.current[index + 1]?.focus();
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handleResend = async () => {
        if (isDevMode) {
            // Dev: just reset the timer
            setTimer(30);
            setIsTimerRunning(true);
            Alert.alert('Dev Mode', `Use OTP: ${DEV_OTP}`);
            return;
        }
        try {
            const { firebaseConfirmation } = require('@/lib/firebaseConfirmation');
            const firebaseAuth = require('@react-native-firebase/auth').default;
            const confirmation = await firebaseAuth().signInWithPhoneNumber(phoneNumber);
            firebaseConfirmation.set(confirmation);
            setTimer(30);
            setIsTimerRunning(true);
            Alert.alert('Sent', 'A new OTP has been sent to your number.');
        } catch {
            Alert.alert('Error', 'Failed to resend OTP. Please try again.');
        }
    };

    const navigateAfterLogin = async (accessToken: string) => {
        try {
            const profileResponse = await api.getProfile(accessToken);
            if (profileResponse.data?.profileCompleted) {
                router.replace('/(tabs)');
            } else {
                router.replace('/profile-setup/basic-info');
            }
        } catch {
            // If profile check fails, go to profile setup
            router.replace('/profile-setup/basic-info');
        }
    };

    const handleVerify = async () => {
        if (otpValue.length < 6) {
            setError('Please enter the 6-digit code');
            return;
        }
        setLoading(true);
        setError('');

        // ── DEV MODE: bypass Firebase, use REST OTP endpoint ──────────────────
        if (isDevMode) {
            if (otpValue !== DEV_OTP) {
                setLoading(false);
                setError(`Wrong dev OTP. Use: ${DEV_OTP}`);
                return;
            }
            try {
                // Try verifyOTP REST endpoint first
                const response = await api.verifyOTP(phoneNumber, otpValue);
                if (response.data) {
                    const { accessToken, refreshToken, user } = response.data;
                    await AsyncStorage.setItem('accessToken', accessToken);
                    await AsyncStorage.setItem('refreshToken', refreshToken);
                    await AsyncStorage.setItem('user', JSON.stringify(user));
                    await fetchUserProfile();
                    await navigateAfterLogin(accessToken);
                } else {
                    // Backend rejected — store a placeholder session for pure UI testing
                    // This lets you test all screens without a working backend
                    console.warn('[DEV] Backend rejected dev OTP. Using placeholder session.');
                    const fakeToken = 'dev-token-placeholder';
                    await AsyncStorage.setItem('accessToken', fakeToken);
                    router.replace('/profile-setup/basic-info');
                }
            } catch (err) {
                console.error('[DEV] Dev login error:', err);
                // Fallback: still let user in for UI testing
                await AsyncStorage.setItem('accessToken', 'dev-token-placeholder');
                router.replace('/profile-setup/basic-info');
            } finally {
                setLoading(false);
            }
            return;
        }

        // ── PRODUCTION: Firebase OTP flow ─────────────────────────────────────
        try {
            const { firebaseConfirmation } = require('@/lib/firebaseConfirmation');
            const confirmation = firebaseConfirmation.get();
            if (!confirmation) {
                setLoading(false);
                Alert.alert('Session expired', 'Please go back and request a new OTP.');
                return;
            }

            // Step 1: Confirm OTP with Firebase
            const userCredential = await confirmation.confirm(otpValue);
            firebaseConfirmation.clear();

            if (!userCredential) {
                setLoading(false);
                Alert.alert('Verification failed', 'Could not verify your number. Please try again.');
                return;
            }

            // Step 2: Get Firebase ID token
            const idToken = await userCredential.user.getIdToken();

            // Step 3: Send ID token to our backend → get our JWT
            const response = await api.firebaseVerify(idToken);

            if (response.error) {
                setLoading(false);
                Alert.alert('Error', response.error);
                return;
            }

            if (response.data) {
                const { accessToken, refreshToken, user } = response.data;
                await AsyncStorage.setItem('accessToken', accessToken);
                await AsyncStorage.setItem('refreshToken', refreshToken);
                await AsyncStorage.setItem('user', JSON.stringify(user));
                await fetchUserProfile();
                await navigateAfterLogin(accessToken);
            }
        } catch (err: any) {
            setLoading(false);
            const msg = err?.message ?? '';
            if (msg.includes('invalid-verification-code') || msg.includes('INVALID_CODE')) {
                setError('Wrong code. Please check and try again.');
            } else if (msg.includes('session-expired') || msg.includes('SESSION_EXPIRED')) {
                setError('OTP expired. Press "Resend OTP" to get a new one.');
            } else {
                console.error('Firebase OTP Error:', err);
                setError(`${err?.code || 'Error'}: ${err?.message || 'Could not verify.'}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const maskedPhone = phoneNumber.replace(/(\+\d{2})(\d{5})(\d{5})/, '$1 *****$3');

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />
            <LinearGradient colors={THEME.bg} style={StyleSheet.absoluteFill} />

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kav}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.content}>

                        {/* Back */}
                        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={22} color={THEME.white} />
                        </TouchableOpacity>

                        {/* Icon */}
                        <View style={styles.iconSection}>
                            <LinearGradient colors={[THEME.accent, THEME.accentAlt]} style={styles.iconBg}>
                                <Ionicons name="shield-checkmark" size={40} color="#fff" />
                            </LinearGradient>
                            <Text style={styles.title}>Verify your{'\n'}<Text style={styles.titleAccent}>number</Text></Text>
                            <Text style={styles.subtitle}>
                                {isDevMode ? 'Dev mode – enter ' : 'Code sent to\n'}<Text style={styles.phone}>{isDevMode ? DEV_OTP : maskedPhone}</Text>
                            </Text>
                        </View>

                        {/* Dev hint */}
                        {isDevMode && (
                            <View style={styles.devHint}>
                                <Ionicons name="code-slash" size={14} color="#FFD700" />
                                <Text style={styles.devHintText}>
                                    🔧 Dev OTP: <Text style={styles.devHintCode}>{DEV_OTP}</Text>
                                </Text>
                            </View>
                        )}

                        {/* OTP Card */}
                        <View style={styles.card}>
                            <Text style={styles.cardLabel}>Enter 6-digit OTP</Text>
                            <View style={styles.otpRow}>
                                {otp.map((digit, i) => (
                                    <TextInput
                                        key={i}
                                        ref={ref => { inputRefs.current[i] = ref; }}
                                        style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                                        value={digit}
                                        onChangeText={t => handleOtpChange(t, i)}
                                        onKeyPress={e => handleKeyPress(e, i)}
                                        keyboardType="number-pad"
                                        maxLength={1}
                                        selectTextOnFocus
                                    />
                                ))}
                            </View>

                            {/* Error */}
                            {error ? (
                                <View style={styles.errorBox}>
                                    <Ionicons name="alert-circle" size={14} color="#FF6B6B" />
                                    <Text style={styles.errorText}>{error}</Text>
                                </View>
                            ) : null}

                            {/* Verify Button */}
                            <TouchableOpacity
                                onPress={handleVerify}
                                disabled={loading || otpValue.length < 6}
                                activeOpacity={0.85}
                                style={[styles.btnWrapper, (loading || otpValue.length < 6) && { opacity: 0.6 }]}
                            >
                                <LinearGradient
                                    colors={otpValue.length === 6 ? [THEME.accent, THEME.accentAlt] : ['#444', '#333']}
                                    style={styles.btn}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                >
                                    <Text style={styles.btnText}>{loading ? 'Verifying...' : 'Verify OTP'}</Text>
                                    {!loading && <Ionicons name="checkmark-circle" size={20} color="#fff" />}
                                </LinearGradient>
                            </TouchableOpacity>

                            {/* Resend */}
                            <View style={styles.resendRow}>
                                {isTimerRunning ? (
                                    <Text style={styles.timerText}>
                                        Resend in <Text style={styles.timerAccent}>00:{timer < 10 ? `0${timer}` : timer}</Text>
                                    </Text>
                                ) : (
                                    <TouchableOpacity onPress={handleResend}>
                                        <Text style={styles.resendText}>Resend OTP</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>

                        <Text style={styles.hint}>
                            <Ionicons name="lock-closed" size={12} color={THEME.muted} />{' '}
                            {isDevMode ? '🔧 Dev mode — Firebase bypassed' : 'Secured by Firebase Authentication'}
                        </Text>
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    kav: { flex: 1 },
    content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center', gap: 22 },
    backBtn: {
        position: 'absolute', top: 16, left: 0, zIndex: 10,
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center', alignItems: 'center',
    },
    iconSection: { alignItems: 'center', gap: 14, marginTop: 40 },
    iconBg: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 34, fontWeight: '800', color: '#fff', textAlign: 'center', lineHeight: 42 },
    titleAccent: { color: THEME.accent },
    subtitle: { fontSize: 15, color: THEME.muted, textAlign: 'center', lineHeight: 24 },
    phone: { color: '#fff', fontWeight: '700' },

    // Dev hint
    devHint: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: 'rgba(255,215,0,0.1)',
        borderRadius: 12, padding: 12,
        borderWidth: 1, borderColor: 'rgba(255,215,0,0.35)',
    },
    devHintText: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
    devHintCode: { color: '#FFD700', fontWeight: '800', letterSpacing: 3 },

    card: { backgroundColor: THEME.card, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: THEME.border, gap: 18 },
    cardLabel: { color: THEME.muted, fontSize: 13, textAlign: 'center', letterSpacing: 0.5 },
    otpRow: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
    otpBox: {
        width: 46, height: 56, borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)',
        textAlign: 'center', fontSize: 22, fontWeight: '700', color: '#fff',
    },
    otpBoxFilled: { borderColor: THEME.accent, backgroundColor: 'rgba(255,107,107,0.12)' },
    errorBox: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: 'rgba(255,107,107,0.1)', borderRadius: 10, padding: 10,
    },
    errorText: { color: '#FF6B6B', fontSize: 13, flex: 1 },
    btnWrapper: { borderRadius: 14, overflow: 'hidden', elevation: 8, shadowColor: THEME.accent, shadowOpacity: 0.4, shadowRadius: 10 },
    btn: { height: 54, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, borderRadius: 14 },
    btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
    resendRow: { alignItems: 'center' },
    timerText: { color: THEME.muted, fontSize: 14 },
    timerAccent: { color: THEME.accent, fontWeight: '700' },
    resendText: { color: THEME.accent, fontSize: 15, fontWeight: '700' },
    hint: { textAlign: 'center', color: THEME.muted, fontSize: 12 },
});
