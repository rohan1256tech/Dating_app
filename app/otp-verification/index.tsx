import { Button } from '@/components/Button';
import { OtpInput } from '@/components/OtpInput';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

export default function OtpVerificationScreen() {
    const router = useRouter();
    const [otp, setOtp] = useState('');
    const [timer, setTimer] = useState(30);
    const [isTimerRunning, setIsTimerRunning] = useState(true);

    useEffect(() => {
        let interval: any;
        if (isTimerRunning && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else if (timer === 0) {
            setIsTimerRunning(false);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning, timer]);

    const handleResend = () => {
        setTimer(30);
        setIsTimerRunning(true);
        // Logic to resend OTP API call would go here
        console.log('Resending OTP...');
    };

    const handleVerify = () => {
        if (otp.length < 6) {
            // Show error ideally
            return;
        }
        // API verification logic here
        router.replace('/profile-setup/basic-info');
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <View style={styles.content}>
                        <View style={styles.header}>
                            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                                <Ionicons name="arrow-back" size={24} color="#333" />
                            </TouchableOpacity>
                            <View style={styles.iconContainer}>
                                <Ionicons name="lock-closed-outline" size={32} color="#FF6B6B" />
                            </View>
                            <Text style={styles.title}>Verification Code</Text>
                            <Text style={styles.subtitle}>
                                We have sent the verification code to {'\n'}
                                <Text style={styles.phoneNumber}>+91 98765 43210</Text>
                            </Text>
                        </View>

                        <View style={styles.form}>
                            <OtpInput
                                length={6}
                                value={otp}
                                onCodeChanged={setOtp}
                            />

                            <Button
                                title="Verify"
                                onPress={handleVerify}
                                disabled={otp.length < 6}
                                style={styles.verifyButton}
                            />

                            <View style={styles.resendContainer}>
                                {isTimerRunning ? (
                                    <Text style={styles.timerText}>
                                        Resend code in <Text style={styles.timerCount}>00:{timer < 10 ? `0${timer}` : timer}</Text>
                                    </Text>
                                ) : (
                                    <Button
                                        title="Resend Code"
                                        variant="ghost"
                                        onPress={handleResend}
                                        textStyle={styles.resendButtonText}
                                        style={styles.resendButton}
                                    />
                                )}
                            </View>
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    keyboardView: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 20,
    },
    backButton: {
        position: 'absolute',
        left: 0,
        top: 0,
        zIndex: 10,
        padding: 8,
    },
    header: {
        marginTop: 60,
        marginBottom: 40,
        alignItems: 'center',
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FFF0F0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
    },
    phoneNumber: {
        color: '#333',
        fontWeight: 'bold',
    },
    form: {
        width: '100%',
        alignItems: 'center',
    },
    verifyButton: {
        marginTop: 20,
    },
    resendContainer: {
        marginTop: 24,
        height: 40,
        justifyContent: 'center',
    },
    timerText: {
        color: '#666',
        fontSize: 14,
    },
    timerCount: {
        color: '#FF6B6B',
        fontWeight: '600',
    },
    resendButton: {
        height: 40,
        width: 'auto',
    },
    resendButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
