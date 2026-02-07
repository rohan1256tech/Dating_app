import { Card } from '@/components/Card';
import { useApp } from '@/context/AppContext';
import { calculateDistance } from '@/utils/location';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
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

export default function HomeScreen() {
    const { potentialMatches, swipeLeft, swipeRight, userProfile } = useApp();
    const [currentIndex, setCurrentIndex] = useState(0);

    // We can't rely on index alone because the array changes when we swipe (if we remove form array)
    // BUT, in my context implementation: setPotentialMatches(prev => prev.filter(p => p.id !== profileId));
    // So the array shrinks. We should always look at index 0.

    // HOWEVER, for the animation to look good, we often keep the array static and move index, 
    // OR we remove the item and let React re-render.
    // The existing code used a static array and moved index.
    // My context implementation removes items.
    // Let's adapt the component to handle the "stack" approach where we always view the first item.

    // Actually, looking at the previous code: `const currentProfile = profiles[currentIndex];`
    // If I change `potentialMatches` to shrink, `currentIndex` should always be 0.

    const currentProfile = potentialMatches[0];
    const nextProfile = potentialMatches[1];

    // Calculate distances if user location is available
    const currentDistance = currentProfile && userProfile.location
        ? calculateDistance(
            userProfile.location.latitude,
            userProfile.location.longitude,
            currentProfile.location.latitude,
            currentProfile.location.longitude
        )
        : undefined;

    const nextDistance = nextProfile && userProfile.location
        ? calculateDistance(
            userProfile.location.latitude,
            userProfile.location.longitude,
            nextProfile.location.latitude,
            nextProfile.location.longitude
        )
        : undefined;

    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const rotate = useSharedValue(0);

    // Derived values for overlays
    const likeOpacity = useAnimatedStyle(() => ({
        opacity: translateX.value > 0 ? translateX.value / 100 : 0,
    }));

    const nopeOpacity = useAnimatedStyle(() => ({
        opacity: translateX.value < 0 ? -translateX.value / 100 : 0,
    }));

    const cardStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { translateY: translateY.value },
            { rotate: `${rotate.value}deg` },
        ],
    }));

    const nextCardStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { scale: withSpring(translateX.value !== 0 ? 1 : 0.95) },
            ],
            opacity: withSpring(translateX.value !== 0 ? 1 : 0.5),
        };
    });

    const handleSwipeComplete = (direction: 'left' | 'right') => {
        if (!currentProfile) return;

        console.log(`Swiped ${direction} on ${currentProfile.name}`);

        if (direction === 'left') {
            swipeLeft(currentProfile.id);
        } else {
            swipeRight(currentProfile.id);
        }

        // Reset values for next card
        translateX.value = 0;
        translateY.value = 0;
        rotate.value = 0;
        // logic changed: we don't increment index, the array shifts.
    };

    const pan = Gesture.Pan()
        .onUpdate((event) => {
            translateX.value = event.translationX;
            translateY.value = event.translationY;
            rotate.value = event.translationX / 20;
        })
        .onEnd((event) => {
            if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
                const direction = event.translationX > 0 ? 'right' : 'left';
                translateX.value = withTiming(
                    direction === 'right' ? width * 1.5 : -width * 1.5,
                    { duration: 300 },
                    () => runOnJS(handleSwipeComplete)(direction)
                );
            } else {
                translateX.value = withSpring(0);
                translateY.value = withSpring(0);
                rotate.value = withSpring(0);
            }
        });

    const resetDeck = () => {
        // In a real app we might fetch more profiles.
        // For now, context controls this. We could expose a reset function in context.
        // But let's just ignore reset for now or hide the button.
    };

    if (!currentProfile) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.emptyState}>
                    <Ionicons name="heart-dislike-outline" size={80} color="#ccc" />
                    <Text style={styles.emptyText}>No more profiles nearby</Text>
                </View>
            </SafeAreaView>
        );
    }


    return (
        <GestureHandlerRootView style={styles.container}>
            <View style={styles.cardsContainer}>
                {/* Next Card (Behind) */}
                {nextProfile && (
                    <Animated.View style={[styles.cardWrapper, styles.nextCard, nextCardStyle]}>
                        <Card profile={nextProfile} distance={nextDistance} />
                    </Animated.View>
                )}

                {/* Current Card (Top) */}
                <GestureDetector gesture={pan}>
                    <Animated.View style={[styles.cardWrapper, cardStyle]}>
                        <Card profile={currentProfile} distance={currentDistance} />

                        {/* Overlays */}
                        <Animated.View style={[styles.overlay, styles.likeOverlay, likeOpacity]}>
                            <Text style={styles.overlayTextLike}>LIKE</Text>
                        </Animated.View>
                        <Animated.View style={[styles.overlay, styles.nopeOverlay, nopeOpacity]}>
                            <Text style={styles.overlayTextNope}>NOPE</Text>
                        </Animated.View>
                    </Animated.View>
                </GestureDetector>
            </View>
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    cardsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardWrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        width: '100%',
        height: '100%',
    },
    nextCard: {
        zIndex: -1,
    },
    overlay: {
        position: 'absolute',
        top: 60,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderWidth: 4,
        borderRadius: 10,
        transform: [{ rotate: '-15deg' }],
        zIndex: 10,
    },
    likeOverlay: {
        left: 40,
        borderColor: '#4CAF50',
    },
    nopeOverlay: {
        right: 40,
        borderColor: '#FF0000',
        transform: [{ rotate: '15deg' }],
    },
    overlayTextLike: {
        color: '#4CAF50',
        fontSize: 32,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    overlayTextNope: {
        color: '#FF0000',
        fontSize: 32,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 18,
        color: '#666',
        marginTop: 20,
        marginBottom: 30,
    },
    resetButton: {
        backgroundColor: '#FF6B6B',
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 25,
    },
    resetButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
