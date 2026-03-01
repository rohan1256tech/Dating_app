import api from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import {
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
    View
} from 'react-native';

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
        if (phoneNumber.length < 10) {
            setError('Please enter a valid 10-digit number');
            return;
        }
        setError('');
        setLoading(true);
        Keyboard.dismiss();

        try {
            const formattedPhone = `+91${phoneNumber}`;
            const response = await api.requestOTP(formattedPhone);

            if (response.error) {
                setError(response.error);
                setLoading(false);
                return;
            }

            setLoading(false);
            // In dev mode backend returns the OTP directly — pass it along so
            // the OTP screen can auto-fill it (no SMS needed during development)
            const devOtp = (response.data as any)?.otp;
            router.push({
                pathname: '/otp-verification',
                params: { phoneNumber: formattedPhone, ...(devOtp ? { devOtp } : {}) },
            });
        } catch (err) {
            setLoading(false);
            setError('Failed to connect to server. Check your internet and try again.');
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
                            <Text style={styles.appName}>Detto</Text>
                            <Text style={styles.tagline}>Find your perfect match ✨</Text>
                        </View>

                        {/* Form Card */}
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Welcome back 👋</Text>
                            <Text style={styles.cardSubtitle}>Enter your phone number to continue</Text>

                            {/* Phone Input */}
                            <View style={[styles.inputRow, isFocused && styles.inputRowFocused]}>
                                <View style={styles.countryBadge}>
                                    <Text style={styles.flag}>🇮🇳</Text>
                                    <Text style={styles.countryCode}>+91</Text>
                                </View>
                                <View style={styles.dividerV} />
                                <TextInput
                                    style={styles.phoneInput}
                                    placeholder="Phone number"
                                    placeholderTextColor="#aaa"
                                    keyboardType="phone-pad"
                                    value={phoneNumber}
                                    onChangeText={(t) => {
                                        setPhoneNumber(t.replace(/[^0-9]/g, ''));
                                        if (error) setError('');
                                    }}
                                    maxLength={10}
                                    onFocus={() => setIsFocused(true)}
                                    onBlur={() => setIsFocused(false)}
                                />
                                {phoneNumber.length === 10 && (
                                    <Ionicons name="checkmark-circle" size={22} color="#4CAF50" style={{ marginRight: 12 }} />
                                )}
                            </View>

                            {error ? (
                                <View style={styles.errorRow}>
                                    <Ionicons name="alert-circle" size={14} color="#FF6B6B" />
                                    <Text style={styles.errorText}>{error}</Text>
                                </View>
                            ) : null}

                            {/* Continue Button */}
                            <TouchableOpacity
                                onPress={handleContinue}
                                disabled={loading || phoneNumber.length < 10}
                                activeOpacity={0.85}
                                style={styles.btnWrapper}
                            >
                                <LinearGradient
                                    colors={phoneNumber.length === 10 ? ['#FF6B6B', '#FF8E53'] : ['#555', '#444']}
                                    style={styles.btn}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    {loading ? (
                                        <Text style={styles.btnText}>Sending OTP...</Text>
                                    ) : (
                                        <>
                                            <Text style={styles.btnText}>Get OTP</Text>
                                            <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
                                        </>
                                    )}
                                </LinearGradient>
                            </TouchableOpacity>

                            <Text style={styles.hint}>
                                We'll send a 6-digit code to verify your number
                            </Text>
                        </View>

                        {/* Footer */}
                        <Text style={styles.footer}>
                            By continuing, you agree to our{' '}
                            <Text style={styles.link}>Terms</Text> &{' '}
                            <Text style={styles.link}>Privacy Policy</Text>
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
    content: {
        flex: 1,
        paddingHorizontal: 24,
        justifyContent: 'center',
        gap: 24,
    },
    logoSection: {
        alignItems: 'center',
        gap: 10,
    },
    logoRing: {
        width: 90,
        height: 90,
        borderRadius: 45,
        shadowColor: '#FF6B6B',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 20,
        elevation: 12,
    },
    logoGradient: {
        width: 90,
        height: 90,
        borderRadius: 45,
        justifyContent: 'center',
        alignItems: 'center',
    },
    appName: {
        fontSize: 36,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 1,
    },
    tagline: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.6)',
    },
    card: {
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        gap: 14,
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#fff',
    },
    cardSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.55)',
        marginTop: -6,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.15)',
        height: 56,
        overflow: 'hidden',
    },
    inputRowFocused: {
        borderColor: '#FF6B6B',
        backgroundColor: 'rgba(255,107,107,0.08)',
    },
    countryBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        gap: 6,
    },
    flag: { fontSize: 20 },
    countryCode: {
        fontSize: 15,
        fontWeight: '600',
        color: '#fff',
    },
    dividerV: {
        width: 1,
        height: 28,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    phoneInput: {
        flex: 1,
        paddingHorizontal: 14,
        fontSize: 17,
        color: '#fff',
        letterSpacing: 1,
    },
    errorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: -4,
    },
    errorText: {
        color: '#FF6B6B',
        fontSize: 13,
    },
    btnWrapper: {
        borderRadius: 14,
        overflow: 'hidden',
        shadowColor: '#FF6B6B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
    },
    btn: {
        height: 54,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 14,
    },
    btnText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
    },
    hint: {
        textAlign: 'center',
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
        marginTop: -4,
    },
    footer: {
        textAlign: 'center',
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
    },
    link: {
        color: '#FF8E53',
        fontWeight: '600',
    },
});
