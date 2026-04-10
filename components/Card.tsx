import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const CARD_HEIGHT = height * 0.70;
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
                <Image
                    source={{ uri: profile.image }}
                    style={styles.image}
                    resizeMode="cover"
                />
            ) : (
                <LinearGradient colors={['#302b63', '#24243e']} style={styles.imagePlaceholder}>
                    <Ionicons name="person" size={80} color="rgba(255,255,255,0.2)" />
                </LinearGradient>
            )}

            {/* Hinge-style deep gradient overlay */}
            <LinearGradient
                colors={['transparent', 'rgba(6,4,22,0.35)', 'rgba(6,4,22,0.85)', 'rgba(6,4,22,0.98)']}
                locations={[0.25, 0.55, 0.78, 1]}
                style={styles.gradient}
            >
                <View style={styles.info}>
                    {/* Name + age row */}
                    <View style={styles.nameRow}>
                        <Text style={styles.name} numberOfLines={1}>{profile.name}</Text>
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

            {/* Top accent glow border */}
            <LinearGradient
                colors={['rgba(255,107,107,0.55)', 'transparent']}
                style={styles.topGlow}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
            />
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
        top: 8,
        // Premium shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.35,
        shadowRadius: 24,
        elevation: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.10)',
    },
    image: {
        width: '100%',
        height: '100%',
        position: 'absolute',
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
        height: '58%',
        borderRadius: 24,
        justifyContent: 'flex-end',
        paddingHorizontal: 22,
        paddingBottom: 24,
    },
    topGlow: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 4,
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
        fontSize: 32,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: 0.2,
        flexShrink: 1,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 6,
    },
    agePill: {
        backgroundColor: 'rgba(255,107,107,0.3)',
        borderRadius: 12,
        paddingHorizontal: 11,
        paddingVertical: 4,
        borderWidth: 1.5,
        borderColor: 'rgba(255,107,107,0.6)',
    },
    ageText: {
        color: '#FF8E53',
        fontWeight: '800',
        fontSize: 16,
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
        fontWeight: '600',
    },
    bio: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.78)',
        lineHeight: 20,
        fontWeight: '400',
    },
    interestsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 7,
        marginTop: 2,
    },
    interestChip: {
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.22)',
    },
    interestText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
});
