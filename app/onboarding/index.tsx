import { GradientBackground } from '@/components/GradientBackground';
import { OnboardingSlide } from '@/components/OnboardingSlide';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View, ViewToken } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const SLIDES = [
    {
        id: '1',
        title: 'Meaningful Connections',
        description: 'Find people who truly resonate with you. Default to depth, not just swipes.',
        image: require('@/assets/images/react-logo.png'), // Placeholder
    },
    {
        id: '2',
        title: 'Smart Matching',
        description: 'Our algorithm understands your preferences to show you only the best potential matches.',
        image: require('@/assets/images/react-logo.png'), // Placeholder
    },
    {
        id: '3',
        title: 'Safe & Private',
        description: 'Your privacy is our priority. Chat safely and securely with verified profiles.',
        image: require('@/assets/images/react-logo.png'), // Placeholder
    },
];

export default function OnboardingScreen() {
    const router = useRouter();
    const flatListRef = useRef<FlatList>(null);
    const scrollX = useSharedValue(0);
    const [currentIndex, setCurrentIndex] = useState(0);

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollX.value = event.contentOffset.x;
        },
    });

    const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (viewableItems.length > 0 && viewableItems[0].index !== null) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    const handleNext = () => {
        if (currentIndex < SLIDES.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
        } else {
            router.replace('/login');
        }
    };

    const handleSkip = () => {
        router.replace('/login');
    };

    const PaginationDot = ({ index }: { index: number }) => {
        const animatedStyle = useAnimatedStyle(() => {
            const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
            const dotWidth = interpolate(
                scrollX.value,
                inputRange,
                [8, 20, 8],
                Extrapolation.CLAMP
            );
            const opacity = interpolate(
                scrollX.value,
                inputRange,
                [0.5, 1, 0.5],
                Extrapolation.CLAMP
            );
            return {
                width: dotWidth,
                opacity,
            };
        });

        return <Animated.View style={[styles.dot, animatedStyle]} />;
    };

    return (
        <View style={styles.container}>
            <GradientBackground>
                <Animated.FlatList
                    ref={flatListRef as any}
                    data={SLIDES}
                    renderItem={({ item }) => <OnboardingSlide {...item} />}
                    keyExtractor={(item) => item.id}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={scrollHandler}
                    scrollEventThrottle={16}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
                />

                <View style={styles.footer}>
                    <View style={styles.pagination}>
                        {SLIDES.map((_, index) => (
                            <PaginationDot key={index} index={index} />
                        ))}
                    </View>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
                            <Text style={styles.skipText}>Skip</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
                            <Text style={styles.nextText}>
                                {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </GradientBackground>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    footer: {
        height: 150,
        paddingHorizontal: 20,
        justifyContent: 'space-between',
        paddingBottom: 40,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 20,
    },
    dot: {
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF6B6B',
        marginHorizontal: 4,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    skipButton: {
        padding: 10,
    },
    skipText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
    nextButton: {
        backgroundColor: '#FF6B6B',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 25,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    nextText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
