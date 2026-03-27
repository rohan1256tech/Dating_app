import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';

const { width, height } = Dimensions.get('window');
const CARD_HEIGHT = height * 0.72;
const CARD_WIDTH = width * 0.92;

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
    // Generate a pseudo-random match percentage based on profile ID for the UI
    const matchPercentage = Math.floor(80 + (profile.name.length * 3) % 20);

    return (
        <View style={styles.card}>
            <Image source={{ uri: profile.image }} style={styles.image} />
            
            {/* Top Match Badge */}
            <View style={styles.matchBadge}>
                <LinearGradient colors={['#FF6B6B', '#FF8E53']} style={styles.matchBadgeGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Ionicons name="sparkles" size={12} color="#fff" />
                    <Text style={styles.matchText}>{matchPercentage}% Match</Text>
                </LinearGradient>
            </View>

            <LinearGradient
                colors={['transparent', 'rgba(15,12,41,0.6)', 'rgba(15,12,41,0.95)']}
                style={styles.gradient}
            >
                <View style={styles.info}>
                    {/* Header Row */}
                    <View style={styles.headerRow}>
                        <View style={styles.nameRow}>
                            <Text style={styles.name}>{profile.name}, {profile.age}</Text>
                            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" style={styles.verifiedIcon} />
                        </View>
                        {/* Online Indicator */}
                        <View style={styles.onlineContainer}>
                            <View style={styles.onlineDot} />
                            <Text style={styles.onlineText}>Recently Active</Text>
                        </View>
                    </View>

                    {/* Distance Pill */}
                    {distance !== undefined && (
                        <View style={styles.distancePill}>
                            <Ionicons name="location-sharp" size={14} color="#FFD700" />
                            <Text style={styles.distanceText}>{distance < 1 ? 'Less than 1 km away' : `${distance} km away`}</Text>
                        </View>
                    )}

                    {/* Bio */}
                    <Text style={styles.bio} numberOfLines={2}>
                        {profile.bio || "Looking for someone to go on adventures with..."}
                    </Text>

                    {/* Interests */}
                    <View style={styles.interestsContainer}>
                        {profile.interests?.slice(0, 3).map((interest, index) => (
                            <View key={index} style={styles.interestChip}>
                                <Text style={styles.interestText}>{interest}</Text>
                            </View>
                        ))}
                        {profile.interests?.length > 3 && (
                            <View style={styles.interestChipMore}>
                                <Text style={styles.interestText}>+{profile.interests.length - 3}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </LinearGradient>
            
            {/* Card Border Glow effect */}
            <View style={styles.borderOverlay} pointerEvents="none" />
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 28,
        backgroundColor: '#1a1729',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 8,
        position: 'absolute',
        top: 10,
    },
    image: {
        width: '100%',
        height: '100%',
        borderRadius: 28,
        resizeMode: 'cover',
    },
    borderOverlay: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 28,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    matchBadge: {
        position: 'absolute',
        top: 20,
        right: 20,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#FF6B6B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
    },
    matchBadgeGrad: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        gap: 4,
    },
    matchText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    gradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '55%',
        borderRadius: 28,
        justifyContent: 'flex-end',
        padding: 24,
    },
    info: {
        gap: 12,
    },
    headerRow: {
        gap: 6,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    name: {
        fontSize: 34,
        fontWeight: '900',
        color: '#fff',
        letterSpacing: 0.5,
    },
    verifiedIcon: {
        marginLeft: 8,
        marginTop: 4,
    },
    onlineContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    onlineDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4CAF50',
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
        elevation: 2,
    },
    onlineText: {
        color: '#4CAF50',
        fontSize: 13,
        fontWeight: '600',
    },
    distancePill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 4,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    distanceText: {
        fontSize: 13,
        color: '#fff',
        fontWeight: '700',
    },
    bio: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.8)',
        lineHeight: 22,
        fontWeight: '400',
        marginTop: 4,
    },
    interestsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 6,
    },
    interestChip: {
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    interestChipMore: {
        backgroundColor: 'rgba(255, 107, 107, 0.15)',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 107, 107, 0.3)',
    },
    interestText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
});
