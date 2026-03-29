import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
    distance?: number;
}

export const Card: React.FC<CardProps> = ({ profile, distance }) => {
    const hasImage = !!profile.image;

    return (
        <View style={styles.card}>
            {/* Photo or placeholder */}
            {hasImage ? (
                <Image source={{ uri: profile.image }} style={styles.image} />
            ) : (
                <LinearGradient colors={['#302b63', '#24243e']} style={styles.imagePlaceholder}>
                    <Ionicons name="person" size={80} color="rgba(255,255,255,0.2)" />
                </LinearGradient>
            )}

            {/* Gradient overlay */}
            <LinearGradient
                colors={['transparent', 'rgba(10,8,30,0.55)', 'rgba(10,8,30,0.97)']}
                locations={[0.3, 0.65, 1]}
                style={styles.gradient}
            >
                <View style={styles.info}>
                    {/* Name + age */}
                    <View style={styles.nameRow}>
                        <Text style={styles.name}>{profile.name}</Text>
                        <View style={styles.agePill}>
                            <Text style={styles.ageText}>{profile.age}</Text>
                        </View>
                    </View>

                    {/* Distance */}
                    {distance !== undefined && (
                        <View style={styles.distanceRow}>
                            <Ionicons name="location" size={13} color="#FF6B6B" />
                            <Text style={styles.distance}>{distance} km away</Text>
                        </View>
                    )}

                    {/* Bio */}
                    {!!profile.bio && (
                        <Text style={styles.bio} numberOfLines={2}>{profile.bio}</Text>
                    )}

                    {/* Interest chips */}
                    {profile.interests?.length > 0 && (
                        <View style={styles.interestsContainer}>
                            {profile.interests.slice(0, 4).map((interest, index) => (
                                <View key={index} style={styles.interestChip}>
                                    <Text style={styles.interestText}>{interest}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: '#1a1729',
        position: 'absolute',
        top: 16,
        // Premium shadow
        shadowColor: '#FF6B6B',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 20,
        elevation: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    image: {
        width: '100%',
        height: '100%',
        position: 'absolute',
        resizeMode: 'cover',
    },
    imagePlaceholder: {
        width: '100%',
        height: '100%',
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    gradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '52%',
        borderRadius: 24,
        justifyContent: 'flex-end',
        paddingHorizontal: 22,
        paddingBottom: 22,
    },
    info: {
        gap: 8,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    name: {
        fontSize: 30,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 0.3,
        flexShrink: 1,
    },
    agePill: {
        backgroundColor: 'rgba(255,107,107,0.25)',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderWidth: 1,
        borderColor: 'rgba(255,107,107,0.5)',
    },
    ageText: {
        color: '#FF8E53',
        fontWeight: '700',
        fontSize: 15,
    },
    distanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: -4,
    },
    distance: {
        fontSize: 13,
        color: '#FF6B6B',
        fontWeight: '500',
    },
    bio: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.75)',
        lineHeight: 20,
    },
    interestsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 7,
        marginTop: 2,
    },
    interestChip: {
        backgroundColor: 'rgba(255,255,255,0.13)',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    interestText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
});
