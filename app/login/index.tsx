import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
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

// ─── DEV MODE ────────────────────────────────────────────────────────────────
// Set to true to bypass Firebase OTP — shows a dummy OTP (123456) on screen
// for instant login during development. Set back to false before production.
const DEV_MODE = false;
const DEV_OTP = '123456';
// ─────────────────────────────────────────────────────────────────────────────

export default function LoginScreen() {
    const router = useRouter();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    React.useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.12, duration: 900, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    const handleContinue = async () => {
        const digits = phoneNumber.replace(/\D/g, '');
        if (digits.length < 10) {
            setError('Please enter a valid 10-digit number');
            return;
        }
        setError('');
        setLoading(true);
        Keyboard.dismiss();

        const formattedPhone = `+91${digits.slice(-10)}`;

        if (DEV_MODE) {
            // ── Dev bypass: skip Firebase, navigate with dummy OTP preset ──
            setLoading(false);
            router.push({
                pathname: '/otp-verification',
                params: { phoneNumber: formattedPhone, devMode: '1' },
            });
            return;
        }

        try {
            // Lazy-load Firebase — crashes if native module not available (Expo Go)
            let firebaseAuth: any;
            try {
                firebaseAuth = require('@react-native-firebase/auth').default;
            } catch {
                setLoading(false);
                setError('Firebase not available. Please install the development build (APK).');
                return;
            }

            const { firebaseConfirmation } = require('@/lib/firebaseConfirmation');
            const confirmation = await firebaseAuth().signInWithPhoneNumber(formattedPhone);
            firebaseConfirmation.set(confirmation);

            router.push({
                pathname: '/otp-verification',
                params: { phoneNumber: formattedPhone },
            });
        } catch (err: any) {
            setLoading(false);
            const msg: string = err?.message ?? '';
            if (msg.includes('TOO_SHORT') || msg.includes('INVALID_PHONE')) {
                setError('Invalid phone number. Use a valid 10-digit Indian number.');
            } else if (msg.includes('TOO_MANY_REQUESTS') || msg.includes('quota')) {
                setError('Too many requests. Please wait a minute and try again.');
            } else if (msg.includes('network')) {
                setError('No internet connection. Check your network and try again.');
            } else {
                console.error('Firebase Auth Error:', err);
                setError(`Firebase Error: ${msg || 'Unknown error'}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />
            <LinearGradient
                colors={['#1a1a2e', '#16213e', '#0f3460']}
                style={StyleSheet.absoluteFill}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.content}>

                        {/* Logo Section */}
                        <View style={styles.logoSection}>
                            <Animated.View style={[styles.logoRing, { transform: [{ scale: pulseAnim }] }]}>
                                <LinearGradient
                                    colors={['#FF6B6B', '#FF8E53']}
                                    style={styles.logoGradient}
                                >
                                    <Ionicons name="heart" size={40} color="#fff" />
                                </LinearGradient>
                            </Animated.View>
                            <Text style={styles.appName}>WhatsLeft</Text>
                            <Text style={styles.tagline}>Find your perfect match ✨</Text>
                        </View>

                        {/* DEV MODE Banner */}
                        {DEV_MODE && (
                            <View style={styles.devBanner}>
                                <Ionicons name="code-slash" size={16} color="#FFD700" />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.devBannerTitle}>🔧 Dev Mode Active</Text>
                                    <Text style={styles.devBannerOtp}>
                                        Use OTP: <Text style={styles.devOtpCode}>{DEV_OTP}</Text> on the next screen
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* Form Card */}
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Enter your number</Text>
                            <Text style={styles.cardSub}>
                                {DEV_MODE ? 'Dev mode — no real SMS will be sent' : "We'll send a one-time code via SMS"}
                            </Text>

                            <View style={[styles.inputRow, isFocused && styles.inputRowFocused]}>
                                <LinearGradient colors={['rgba(255,107,107,0.15)', 'rgba(255,142,83,0.08)']} style={styles.flagBg}>
                                    <Text style={styles.flag}>🇮🇳</Text>
                                    <Text style={styles.cc}>+91</Text>
                                </LinearGradient>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter 10-digit number"
                                    placeholderTextColor="rgba(255,255,255,0.3)"
                                    keyboardType="phone-pad"
                                    maxLength={10}
                                    value={phoneNumber}
                                    onChangeText={t => { setPhoneNumber(t); setError(''); }}
                                    onFocus={() => setIsFocused(true)}
                                    onBlur={() => setIsFocused(false)}
                                    returnKeyType="done"
                                    onSubmitEditing={handleContinue}
                                />
                            </View>

                            {error ? (
                                <View style={styles.errorBox}>
                                    <Ionicons name="alert-circle" size={16} color="#FF6B6B" />
                                    <Text style={styles.errorText}>{error}</Text>
                                </View>
                            ) : null}

                            <TouchableOpacity
                                style={[styles.ctaWrapper, (loading || phoneNumber.length < 10) && { opacity: 0.6 }]}
                                onPress={handleContinue}
                                disabled={loading || phoneNumber.length < 10}
                                activeOpacity={0.85}
                            >
                                <LinearGradient
                                    colors={['#FF6B6B', '#FF8E53']}
                                    style={styles.cta}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#fff" size="small" />
                                    ) : (
                                        <>
                                            <Text style={styles.ctaText}>{DEV_MODE ? 'Continue (Dev)' : 'Send OTP'}</Text>
                                            <Ionicons name="arrow-forward" size={20} color="#fff" />
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.legal}>
                            By continuing you agree to our Terms & Privacy Policy.
                            {DEV_MODE ? '\n🔧 Firebase bypassed for development.' : '\nSMS sent via Firebase — standard rates may apply.'}
                        </Text>
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    keyboardView: { flex: 1 },
    content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center', gap: 20 },
    logoSection: { alignItems: 'center', gap: 12 },
    logoRing: { width: 100, height: 100, borderRadius: 50, overflow: 'hidden' },
    logoGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    appName: { fontSize: 36, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
    tagline: { fontSize: 15, color: 'rgba(255,255,255,0.5)' },

    // Dev banner
    devBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: 'rgba(255,215,0,0.12)',
        borderRadius: 14,
        padding: 14,
        borderWidth: 1.5,
        borderColor: 'rgba(255,215,0,0.4)',
    },
    devBannerTitle: { color: '#FFD700', fontWeight: '800', fontSize: 13 },
    devBannerOtp: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 },
    devOtpCode: { color: '#FFD700', fontWeight: '800', fontSize: 15, letterSpacing: 2 },

    card: {
        backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 24,
        padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', gap: 16,
    },
    cardTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
    cardSub: { fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: -8 },
    inputRow: {
        flexDirection: 'row', alignItems: 'center', borderRadius: 14,
        borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)', overflow: 'hidden',
    },
    inputRowFocused: { borderColor: '#FF6B6B' },
    flagBg: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 6 },
    flag: { fontSize: 20 },
    cc: { fontSize: 15, fontWeight: '700', color: '#fff' },
    input: { flex: 1, color: '#fff', fontSize: 18, fontWeight: '600', paddingVertical: 14, paddingRight: 14 },
    errorBox: {
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: 'rgba(255,107,107,0.1)', borderRadius: 10, padding: 10,
    },
    errorText: { color: '#FF6B6B', fontSize: 13, flex: 1 },
    ctaWrapper: { borderRadius: 14, overflow: 'hidden', elevation: 8, shadowColor: '#FF6B6B', shadowOpacity: 0.4, shadowRadius: 12 },
    cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 17 },
    ctaText: { color: '#fff', fontSize: 17, fontWeight: '800' },
    legal: { textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 11, lineHeight: 18 },
});
