import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';

export default function LoginScreen() {
    const router = useRouter();
    const [phoneNumber, setPhoneNumber] = useState('');
    const [error, setError] = useState('');

    const handleContinue = () => {
        // Basic validation
        if (phoneNumber.length < 10) {
            setError('Please enter a valid phone number');
            return;
        }
        setError('');
        // Navigate to OTP
        router.push('/otp-verification');
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
                            <View style={styles.iconContainer}>
                                <Ionicons name="chatbubbles-outline" size={32} color="#FF6B6B" />
                            </View>
                            <Text style={styles.title}>Let's get started</Text>
                            <Text style={styles.subtitle}>Enter your phone number to sign up or log in.</Text>
                        </View>

                        <View style={styles.form}>
                            <View style={styles.phoneInputContainer}>
                                <View style={styles.countryCode}>
                                    <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                                </View>
                                <View style={styles.inputWrapper}>
                                    <Input
                                        placeholder="Phone Number"
                                        keyboardType="phone-pad"
                                        value={phoneNumber}
                                        onChangeText={(text) => {
                                            setPhoneNumber(text.replace(/[^0-9]/g, ''));
                                            if (error) setError('');
                                        }}
                                        error={error}
                                        maxLength={10}
                                        style={{ borderWidth: 0, backgroundColor: 'transparent' }} // Override styles for cleaner look combined with country code
                                        containerStyle={{ marginBottom: 0 }}
                                    />
                                </View>
                            </View>

                            <Button
                                title="Continue"
                                onPress={handleContinue}
                                style={styles.continueButton}
                            />

                            <View style={styles.dividerContainer}>
                                <View style={styles.dividerLine} />
                                <Text style={styles.dividerText}>OR</Text>
                                <View style={styles.dividerLine} />
                            </View>

                            <Button
                                title="Continue with Google"
                                variant="secondary"
                                onPress={() => { }}
                                style={styles.socialButton}
                            />
                            <Button
                                title="Continue with Apple"
                                variant="secondary"
                                onPress={() => { }}
                                style={styles.socialButton}
                            />

                        </View>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>
                                By continuing, you agree to our <Text style={styles.link}>Terms</Text> and <Text style={styles.link}>Privacy Policy</Text>.
                            </Text>
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
        justifyContent: 'center',
    },
    header: {
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
        lineHeight: 22,
    },
    form: {
        width: '100%',
    },
    phoneInputContainer: {
        flexDirection: 'row',
        marginBottom: 24,
        height: 52,
    },
    countryCode: {
        width: 80,
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    countryCodeText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    inputWrapper: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        justifyContent: 'center',
    },
    continueButton: {
        marginTop: 8,
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E0E0E0',
    },
    dividerText: {
        marginHorizontal: 12,
        color: '#999',
        fontSize: 14,
    },
    socialButton: {
        marginBottom: 12,
    },
    footer: {
        marginTop: 24,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
        lineHeight: 18,
    },
    link: {
        color: '#FF6B6B',
        fontWeight: '500',
    }
});
