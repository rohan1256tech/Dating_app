import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';

const { width, height } = Dimensions.get('window');
const CARD_HEIGHT = height * 0.7;
const CARD_WIDTH = width * 0.9;

export interface Profile {
    id: string;
    name: string;
    age: number;
    bio: string;
    image: string;
    interests: string[];
}

interface CardProps {
    profile: Profile;
    distance?: number; // Distance in km
}

export const Card: React.FC<CardProps> = ({ profile, distance }) => {
    return (
        <View style={styles.card}>
            <Image source={{ uri: profile.image }} style={styles.image} />
            <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.9)']}
                style={styles.gradient}
            >
                <View style={styles.info}>
                    <Text style={styles.name}>
                        {profile.name}, {profile.age}
                    </Text>
                    {distance !== undefined && (
                        <Text style={styles.distance}>
                            📍 {distance} km away
                        </Text>
                    )}
                    <Text style={styles.bio} numberOfLines={2}>
                        {profile.bio}
                    </Text>
                    <View style={styles.interestsContainer}>
                        {profile.interests.slice(0, 3).map((interest, index) => (
                            <View key={index} style={styles.interestChip}>
                                <Text style={styles.interestText}>{interest}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 20,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        position: 'absolute',
        top: 20,
    },
    image: {
        width: '100%',
        height: '100%',
        borderRadius: 20,
        resizeMode: 'cover',
    },
    gradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '40%',
        borderRadius: 20,
        justifyContent: 'flex-end',
        padding: 20,
    },
    info: {
        marginBottom: 20,
    },
    name: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    distance: {
        fontSize: 14,
        color: '#FFD700',
        marginBottom: 8,
        fontWeight: '500',
    },
    bio: {
        fontSize: 16,
        color: '#eee',
        marginBottom: 12,
        lineHeight: 22,
    },
    interestsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    interestChip: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    interestText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
});
