import { Card } from '@/components/Card';
import { useApp } from '@/context/AppContext';
import { calculateDistance } from '@/utils/location';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
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
const SWIPE_THRESHOLD = width * 0.3;

// ─── Swipe card — isolated so key-based re-mount gives fresh animated values ──
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

    const likeOpacity = useAnimatedStyle(() => ({
        opacity: translateX.value > 0 ? Math.min(translateX.value / 80, 1) : 0,
    }));
    const nopeOpacity = useAnimatedStyle(() => ({
        opacity: translateX.value < 0 ? Math.min(-translateX.value / 80, 1) : 0,
    }));
    const cardStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { rotate: `${rotate.value}deg` },
        ],
    }));
    const nextCardStyle = useAnimatedStyle(() => ({
        transform: [{ scale: withSpring(translateX.value !== 0 ? 1 : 0.95) }],
        opacity: withSpring(translateX.value !== 0 ? 1 : 0.6),
    }));

    const handleSwipeComplete = (direction: 'left' | 'right') => {
        onSwipeComplete(direction);
        // DO NOT reset here — component will be re-mounted with new profile via key
    };

    const pan = Gesture.Pan()
        .onUpdate((e) => {
            translateX.value = e.translationX;
            translateY.value = e.translationY;
            rotate.value = e.translationX / 20;
        })
        .onEnd((e) => {
            if (Math.abs(e.translationX) > SWIPE_THRESHOLD) {
                const dir = e.translationX > 0 ? 'right' : 'left';
                translateX.value = withTiming(
                    dir === 'right' ? width * 1.5 : -width * 1.5,
                    { duration: 300 },
                    () => runOnJS(handleSwipeComplete)(dir)
                );
            } else {
                translateX.value = withSpring(0);
                translateY.value = withSpring(0);
                rotate.value = withSpring(0);
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

                    {/* LIKE overlay */}
                    <Animated.View style={[styles.overlay, styles.likeOverlay, likeOpacity]}>
                        <LinearGradient colors={['#4CAF5044', '#4CAF5011']} style={styles.overlayGrad}>
                            <Ionicons name="heart" size={20} color="#4CAF50" style={{ marginRight: 6 }} />
                            <Text style={styles.overlayTextLike}>LIKE</Text>
                        </LinearGradient>
                    </Animated.View>

                    {/* NOPE overlay */}
                    <Animated.View style={[styles.overlay, styles.nopeOverlay, nopeOpacity]}>
                        <LinearGradient colors={['#FF000044', '#FF000011']} style={styles.overlayGrad}>
                            <Ionicons name="close" size={20} color="#FF4444" style={{ marginRight: 6 }} />
                            <Text style={styles.overlayTextNope}>NOPE</Text>
                        </LinearGradient>
                    </Animated.View>
                </Animated.View>
            </GestureDetector>
        </View>
    );
}

// ─── Helper: safe distance calculation ────────────────────────────────────────
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

// ─── Main Screen ──────────────────────────────────────────────────────────────

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
    // Track action-button triggered swipe direction for programmatic swipe
    const pendingSwipe = useRef<'left' | 'right' | null>(null);

    // Refresh profiles every time this tab is focused
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
        // No manual translateX reset needed — SwipeCard is re-mounted via key
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
                    <View style={styles.headerRight}>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/likes')} style={styles.likesBtn}>
                            <Ionicons name="heart-outline" size={24} color="#FF6B6B" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => { setRefreshing(true); fetchPotentialMatches().finally(() => setRefreshing(false)); }}>
                            <Ionicons name="refresh" size={24} color="#FF6B6B" />
                        </TouchableOpacity>
                    </View>
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
                    <View style={styles.headerRight}>
                        {refreshing && <ActivityIndicator size="small" color="#FF6B6B" style={{ marginRight: 8 }} />}
                        {/* ❤️ Likes button — top right */}
                        <TouchableOpacity
                            onPress={() => router.push('/(tabs)/likes')}
                            style={styles.likesBtn}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="heart" size={22} color="#FF6B6B" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Cards — key = currentProfile.id so component remounts on each swipe (no blink) */}
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
                    <TouchableOpacity style={[styles.actionBtn, styles.passBtn]} onPress={handlePass} activeOpacity={0.8}>
                        <Ionicons name="close" size={32} color="#FF4444" />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.actionBtn, styles.superBtn]} activeOpacity={0.8}>
                        <Ionicons name="star" size={24} color="#FFD700" />
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.actionBtn, styles.likeBtn]} onPress={handleLike} activeOpacity={0.8}>
                        <Ionicons name="heart" size={32} color="#FF6B6B" />
                    </TouchableOpacity>
                </View>
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
        fontSize: 28,
        fontWeight: '800',
        color: '#FF6B6B',
        letterSpacing: 0.5,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    likesBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,107,107,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,107,107,0.3)',
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
    overlay: {
        position: 'absolute',
        top: 60,
        borderRadius: 12,
        overflow: 'hidden',
    },
    overlayGrad: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 3,
        flexDirection: 'row',
        alignItems: 'center',
    },
    likeOverlay: {
        left: 30,
        transform: [{ rotate: '-15deg' }],
        borderColor: '#4CAF50',
    },
    nopeOverlay: {
        right: 30,
        transform: [{ rotate: '15deg' }],
        borderColor: '#FF4444',
    },
    overlayTextLike: {
        color: '#4CAF50',
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: 2,
    },
    overlayTextNope: {
        color: '#FF4444',
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: 2,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 24,
        gap: 20,
    },
    actionBtn: {
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 50,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    passBtn: { width: 64, height: 64 },
    likeBtn: { width: 64, height: 64 },
    superBtn: { width: 52, height: 52 },
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
