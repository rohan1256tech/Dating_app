import { Card } from '@/components/Card';
import { useApp } from '@/context/AppContext';
import { calculateDistance } from '@/utils/location';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.32;

// ─── Swipe card ────────────────────────────────────────────────────────────────
function SwipeCard({
    currentProfile,
    nextProfile,
    currentDistance,
    nextDistance,
    onSwipeComplete,
}: {
    currentProfile: any;
    nextProfile: any;
    currentDistance: number | undefined;
    nextDistance: number | undefined;
    onSwipeComplete: (dir: 'left' | 'right') => void;
}) {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const rotate = useSharedValue(0);

    // LIKE / NOPE opacity — driven purely by translateX (no opacity flicker on next card)
    const likeOpacity = useAnimatedStyle(() => ({
        opacity: translateX.value > 0 ? Math.min(translateX.value / 70, 1) : 0,
    }));
    const nopeOpacity = useAnimatedStyle(() => ({
        opacity: translateX.value < 0 ? Math.min(-translateX.value / 70, 1) : 0,
    }));

    // Current card transform
    const cardStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { rotate: `${rotate.value}deg` },
        ],
    }));

    // Next card: scale only — NO opacity animation to prevent blinking
    const nextCardStyle = useAnimatedStyle(() => ({
        transform: [{
            scale: translateX.value !== 0
                ? withSpring(1.0, { damping: 18 })
                : withSpring(0.95, { damping: 18 }),
        }],
        opacity: 0.92, // static — no animation
    }));

    const handleSwipeComplete = (direction: 'left' | 'right') => {
        onSwipeComplete(direction);
    };

    const pan = Gesture.Pan()
        .onUpdate((e) => {
            translateX.value = e.translationX;
            translateY.value = e.translationY * 0.4;
            rotate.value = e.translationX / 18;
        })
        .onEnd((e) => {
            if (Math.abs(e.translationX) > SWIPE_THRESHOLD) {
                const dir = e.translationX > 0 ? 'right' : 'left';
                translateX.value = withTiming(
                    dir === 'right' ? width * 1.6 : -width * 1.6,
                    { duration: 280 },
                    () => runOnJS(handleSwipeComplete)(dir)
                );
            } else {
                translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
                translateY.value = withSpring(0, { damping: 20 });
                rotate.value = withSpring(0, { damping: 20 });
            }
        });

    return (
        <View style={styles.cardsContainer}>
            {nextProfile && (
                <Animated.View style={[styles.cardWrapper, styles.nextCard, nextCardStyle]}>
                    <Card profile={nextProfile} distance={nextDistance} />
                </Animated.View>
            )}
            <GestureDetector gesture={pan}>
                <Animated.View style={[styles.cardWrapper, cardStyle]}>
                    <Card profile={currentProfile} distance={currentDistance} />

                    {/* Hinge-style LIKE stamp */}
                    <Animated.View style={[styles.stamp, styles.likeStamp, likeOpacity]}>
                        <LinearGradient
                            colors={['rgba(50,200,90,0.18)', 'rgba(50,200,90,0.08)']}
                            style={styles.stampGrad}
                        >
                            <Ionicons name="heart" size={22} color="#32C85A" style={{ marginRight: 6 }} />
                            <Text style={[styles.stampText, { color: '#32C85A', borderColor: '#32C85A' }]}>LIKE</Text>
                        </LinearGradient>
                    </Animated.View>

                    {/* Hinge-style NOPE stamp */}
                    <Animated.View style={[styles.stamp, styles.nopeStamp, nopeOpacity]}>
                        <LinearGradient
                            colors={['rgba(255,60,60,0.18)', 'rgba(255,60,60,0.08)']}
                            style={styles.stampGrad}
                        >
                            <Ionicons name="close" size={22} color="#FF3C3C" style={{ marginRight: 6 }} />
                            <Text style={[styles.stampText, { color: '#FF3C3C', borderColor: '#FF3C3C' }]}>NOPE</Text>
                        </LinearGradient>
                    </Animated.View>
                </Animated.View>
            </GestureDetector>
        </View>
    );
}

// ─── Helper ────────────────────────────────────────────────────────────────────
function safeDistance(
    userLoc: { latitude: number; longitude: number } | undefined,
    profileLoc: { latitude: number; longitude: number } | undefined,
): number | undefined {
    if (!userLoc || !profileLoc) return undefined;
    const { latitude: uLat, longitude: uLng } = userLoc;
    const { latitude: pLat, longitude: pLng } = profileLoc;
    if (!isFinite(uLat) || !isFinite(uLng) || !isFinite(pLat) || !isFinite(pLng)) return undefined;
    if (uLat === 0 && uLng === 0) return undefined;
    if (pLat === 0 && pLng === 0) return undefined;
    return calculateDistance(uLat, uLng, pLat, pLng);
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function HomeScreen() {
    const {
        potentialMatches,
        swipeLeft,
        swipeRight,
        userProfile,
        fetchPotentialMatches,
    } = useApp();
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);

    useFocusEffect(
        useCallback(() => {
            const refresh = async () => {
                setRefreshing(true);
                await fetchPotentialMatches();
                setRefreshing(false);
            };
            refresh();
        }, [])
    );

    const currentProfile = potentialMatches[0];
    const nextProfile = potentialMatches[1];

    const currentDistance = safeDistance(userProfile?.location, currentProfile?.location);
    const nextDistance = safeDistance(userProfile?.location, nextProfile?.location);

    const handleSwipeComplete = (direction: 'left' | 'right') => {
        if (!currentProfile) return;
        if (direction === 'left') swipeLeft(currentProfile.id);
        else swipeRight(currentProfile.id);
    };

    const handleLike = () => {
        if (!currentProfile) return;
        swipeRight(currentProfile.id);
    };

    const handlePass = () => {
        if (!currentProfile) return;
        swipeLeft(currentProfile.id);
    };

    if (refreshing && potentialMatches.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={StyleSheet.absoluteFill} />
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>WhatsLeft</Text>
                    <Ionicons name="options-outline" size={24} color="#FF6B6B" />
                </View>
                <View style={styles.loadingState}>
                    <ActivityIndicator size="large" color="#FF6B6B" />
                    <Text style={styles.loadingText}>Finding people near you...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!currentProfile) {
        return (
            <SafeAreaView style={styles.container}>
                <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={StyleSheet.absoluteFill} />
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>WhatsLeft</Text>
                    <TouchableOpacity onPress={() => { setRefreshing(true); fetchPotentialMatches().finally(() => setRefreshing(false)); }}>
                        <Ionicons name="refresh" size={24} color="#FF6B6B" />
                    </TouchableOpacity>
                </View>
                <View style={styles.emptyState}>
                    <LinearGradient colors={['rgba(255,107,107,0.15)', 'rgba(255,142,83,0.08)']} style={styles.emptyIcon}>
                        <Ionicons name="heart-dislike-outline" size={52} color="#FF6B6B" />
                    </LinearGradient>
                    <Text style={styles.emptyTitle}>You're all caught up!</Text>
                    <Text style={styles.emptyText}>No more profiles nearby right now.{`\n`}Check back soon.</Text>
                    <TouchableOpacity
                        style={styles.refreshBtn}
                        onPress={() => { setRefreshing(true); fetchPotentialMatches().finally(() => setRefreshing(false)); }}
                    >
                        <LinearGradient colors={['#FF6B6B', '#FF8E53']} style={styles.refreshBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                            <Ionicons name="refresh" size={18} color="#fff" />
                            <Text style={styles.refreshBtnText}>Refresh</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <GestureHandlerRootView style={styles.container}>
            <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={StyleSheet.absoluteFill} />
            <SafeAreaView style={{ flex: 1 }}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>WhatsLeft</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        {refreshing && <ActivityIndicator size="small" color="#FF6B6B" style={{ marginRight: 8 }} />}
                    </View>
                </View>

                {/* Cards */}
                <SwipeCard
                    key={currentProfile.id}
                    currentProfile={currentProfile}
                    nextProfile={nextProfile}
                    currentDistance={currentDistance}
                    nextDistance={nextDistance}
                    onSwipeComplete={handleSwipeComplete}
                />

                {/* Action Buttons */}
                <View style={styles.actions}>
                    <TouchableOpacity style={styles.passBtn} onPress={handlePass} activeOpacity={0.85}>
                        <LinearGradient
                            colors={['#2a0a0a', '#3d0f0f']}
                            style={styles.passBtnGrad}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        >
                            <View style={styles.passIconRing}>
                                <Ionicons name="close" size={28} color="#FF3C3C" />
                            </View>
                            <Text style={styles.passBtnText}>Pass</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.likeBtn} onPress={handleLike} activeOpacity={0.85}>
                        <LinearGradient
                            colors={['#FF6B6B', '#FF8E53']}
                            style={styles.likeBtnGrad}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        >
                            <View style={styles.likeIconRing}>
                                <Ionicons name="heart" size={28} color="#fff" />
                            </View>
                            <Text style={styles.likeBtnText}>Like</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    headerTitle: {
        fontSize: 30,
        fontWeight: '800',
        color: '#FF6B6B',
        letterSpacing: 0.5,
    },
    cardsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    cardWrapper: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    nextCard: { zIndex: -1 },

    // Stamps (Hinge-style)
    stamp: {
        position: 'absolute',
        top: 68,
        borderRadius: 14,
        overflow: 'hidden',
        borderWidth: 3,
    },
    likeStamp: {
        left: 24,
        transform: [{ rotate: '-18deg' }],
        borderColor: '#32C85A',
    },
    nopeStamp: {
        right: 24,
        transform: [{ rotate: '18deg' }],
        borderColor: '#FF3C3C',
    },
    stampGrad: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingVertical: 10,
    },
    stampText: {
        fontSize: 30,
        fontWeight: '900',
        letterSpacing: 3,
    },

    // Action buttons — pill-shaped, premium look
    actions: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 24,
        gap: 16,
    },
    passBtn: {
        flex: 1,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1.5,
        borderColor: 'rgba(255,60,60,0.3)',
        shadowColor: '#FF3C3C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 6,
    },
    passBtnGrad: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 18,
        paddingHorizontal: 20,
    },
    passIconRing: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(255,60,60,0.15)',
        borderWidth: 1.5,
        borderColor: 'rgba(255,60,60,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    passBtnText: {
        color: '#FF3C3C',
        fontSize: 17,
        fontWeight: '800',
        letterSpacing: 0.3,
    },
    likeBtn: {
        flex: 1,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#FF6B6B',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.45,
        shadowRadius: 14,
        elevation: 10,
    },
    likeBtnGrad: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 18,
        paddingHorizontal: 20,
    },
    likeIconRing: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    likeBtnText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '800',
        letterSpacing: 0.3,
    },

    loadingState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    loadingText: {
        color: 'rgba(255,255,255,0.55)',
        fontSize: 16,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 14,
        paddingHorizontal: 40,
    },
    emptyIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#fff',
    },
    emptyText: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.55)',
        textAlign: 'center',
        lineHeight: 22,
    },
    refreshBtn: {
        borderRadius: 30,
        overflow: 'hidden',
        marginTop: 8,
        shadowColor: '#FF6B6B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    refreshBtnGrad: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 28,
        paddingVertical: 14,
        gap: 8,
    },
    refreshBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
});
