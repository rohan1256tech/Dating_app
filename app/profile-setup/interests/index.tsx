import { Button } from '@/components/Button';
import { useApp } from '@/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const INTERESTS = [
    'Photography', 'Cooking', 'Hiking', 'Gaming', 'Art',
    'Music', 'Travel', 'Tech', 'Fitness', 'Reading',
    'Movies', 'Dancing', 'Yoga', 'Writing', 'Sports',
    'Fashion', 'Foodie', 'Animals', 'Nature', 'Cars'
];

export default function ProfileInterestsScreen() {
    const router = useRouter();
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

    const toggleInterest = (interest: string) => {
        if (selectedInterests.includes(interest)) {
            setSelectedInterests(prev => prev.filter(i => i !== interest));
        } else {
            if (selectedInterests.length < 5) { // Optional max limit
                setSelectedInterests(prev => [...prev, interest]);
            }
        }
    };

    const { updateUserProfile } = useApp();

    const handleContinue = () => {
        if (selectedInterests.length >= 3) {
            updateUserProfile({ interests: selectedInterests });
            router.replace('/(tabs)');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <View style={styles.content}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.stepIndicator}>Step 3 of 3</Text>
                    <Text style={styles.title}>Your Interests</Text>
                    <Text style={styles.subtitle}>Pick at least 3 things you love.</Text>
                </View>

                <View style={styles.chipsContainer}>
                    {INTERESTS.map((interest) => {
                        const isSelected = selectedInterests.includes(interest);
                        return (
                            <TouchableOpacity
                                key={interest}
                                style={[
                                    styles.chip,
                                    isSelected && styles.chipSelected
                                ]}
                                onPress={() => toggleInterest(interest)}
                                activeOpacity={0.7}
                            >
                                <Text style={[
                                    styles.chipText,
                                    isSelected && styles.chipTextSelected
                                ]}>
                                    {interest}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View style={styles.footer}>
                    <Text style={styles.counterText}>
                        {selectedInterests.length}/5 selected
                    </Text>
                    <Button
                        title="Start Dating"
                        onPress={handleContinue}
                        disabled={selectedInterests.length < 3}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        flex: 1,
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
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    chip: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        backgroundColor: '#FAFAFA',
    },
    chipSelected: {
        borderColor: '#FF6B6B',
        backgroundColor: '#FFF0F0',
    },
    chipText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    chipTextSelected: {
        color: '#FF6B6B',
        fontWeight: '600',
    },
    footer: {
        marginTop: 'auto',
        gap: 12,
    },
    counterText: {
        textAlign: 'center',
        color: '#999',
        fontSize: 14,
        marginBottom: 8,
    },
});
