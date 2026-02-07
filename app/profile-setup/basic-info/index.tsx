import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useApp } from '@/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

export default function ProfileBasicInfoScreen() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [dob, setDob] = useState('');
    const [gender, setGender] = useState<string | null>(null);
    const [errors, setErrors] = useState<{ name?: string; dob?: string; gender?: string }>({});

    const validate = () => {
        const newErrors: { name?: string; dob?: string; gender?: string } = {};
        let isValid = true;

        if (name.trim().length < 2) {
            newErrors.name = 'Name must be at least 2 characters long.';
            isValid = false;
        }

        const dobRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/(19|20)\d\d$/;
        if (!dobRegex.test(dob)) {
            newErrors.dob = 'Please enter a valid date (DD/MM/YYYY).';
            isValid = false;
        } else {
            const [day, month, year] = dob.split('/').map(Number);
            const dateObj = new Date(year, month - 1, day);
            const now = new Date();
            const age = now.getFullYear() - dateObj.getFullYear();
            // Simple age check, can be more precise
            if (age < 18) {
                newErrors.dob = 'You must be at least 18 years old.';
                isValid = false;
            }
        }

        if (!gender) {
            newErrors.gender = 'Please select your gender.';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const { updateUserProfile } = useApp();

    const handleContinue = () => {
        if (validate()) {
            // Calculate age from DOB
            const [day, month, year] = dob.split('/').map(Number);
            const dateObj = new Date(year, month - 1, day);
            const now = new Date();
            const age = now.getFullYear() - dateObj.getFullYear();

            updateUserProfile({ name, age });
            router.push('/profile-setup/photos');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView contentContainerStyle={styles.scrollContent}>
                        <View style={styles.header}>
                            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                                <Ionicons name="arrow-back" size={24} color="#333" />
                            </TouchableOpacity>
                            <Text style={styles.stepIndicator}>Step 1 of 3</Text>
                            <Text style={styles.title}>Basic Details</Text>
                            <Text style={styles.subtitle}>Let's get to know you better.</Text>
                        </View>

                        <View style={styles.form}>
                            <Input
                                label="Full Name"
                                placeholder="Enter your full name"
                                value={name}
                                onChangeText={setName}
                                error={errors.name}
                                autoCapitalize="words"
                            />

                            <Input
                                label="Date of Birth (DD/MM/YYYY)"
                                placeholder="DD/MM/YYYY"
                                value={dob}
                                onChangeText={(text) => {
                                    // Simple formatting logic could go here
                                    setDob(text);
                                }}
                                error={errors.dob}
                                keyboardType="numeric"
                                maxLength={10}
                            />

                            <View style={styles.genderContainer}>
                                <Text style={styles.label}>Gender</Text>
                                <View style={styles.genderOptions}>
                                    {['Male', 'Female', 'Other'].map((option) => (
                                        <TouchableOpacity
                                            key={option}
                                            style={[
                                                styles.genderOption,
                                                gender === option && styles.genderOptionSelected
                                            ]}
                                            onPress={() => setGender(option)}
                                        >
                                            <Text style={[
                                                styles.genderOptionText,
                                                gender === option && styles.genderOptionTextSelected
                                            ]}>
                                                {option}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
                            </View>

                            <Button
                                title="Continue"
                                onPress={handleContinue}
                                style={styles.continueButton}
                            />
                        </View>
                    </ScrollView>
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
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    header: {
        marginTop: 20,
        marginBottom: 30,
    },
    backButton: {
        marginBottom: 20,
        alignSelf: 'flex-start',
        padding: 4,
        marginLeft: -4,
    },
    stepIndicator: {
        fontSize: 14,
        color: '#FF6B6B',
        fontWeight: '600',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        lineHeight: 24,
    },
    form: {
        marginTop: 10,
    },
    genderContainer: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        color: '#333',
        marginBottom: 12,
        fontWeight: '500',
    },
    genderOptions: {
        flexDirection: 'row',
        gap: 12,
    },
    genderOption: {
        flex: 1,
        height: 50,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        backgroundColor: '#FAFAFA',
        justifyContent: 'center',
        alignItems: 'center',
    },
    genderOptionSelected: {
        borderColor: '#FF6B6B',
        backgroundColor: '#FFF0F0',
    },
    genderOptionText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
    genderOptionTextSelected: {
        color: '#FF6B6B',
        fontWeight: '600',
    },
    errorText: {
        marginTop: 4,
        fontSize: 12,
        color: '#FF6B6B',
    },
    continueButton: {
        marginTop: 20,
    },
});
