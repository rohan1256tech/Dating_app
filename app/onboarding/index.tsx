import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewToken,
} from 'react-native';
import Animated, {
    Extrapolation,
    FadeInDown,
    interpolate,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

// Design system — shared with login
const THEME = {
    bg: ['#0f0c29', '#302b63', '#24243e'] as const,
    accent: '#FF6B6B',
    accentAlt: '#FF8E53',
    white: '#FFFFFF',
    muted: 'rgba(255,255,255,0.55)',
};

interface Slide {
    id: string;
    icon: keyof typeof Ionicons.glyphMap;
    iconBg: string[];
    badge: keyof typeof Ionicons.glyphMap;
    title: string;
    highlight: string;
    description: string;
    features: { icon: keyof typeof Ionicons.glyphMap; text: string }[];
}

const SLIDES: Slide[] = [
    {
        id: '1',
        icon: 'heart',
        iconBg: ['#FF6B6B', '#FF8E53'],
        badge: 'sparkles',
        title: 'Meaningful',
        highlight: 'Connections',
        description: 'Go beyond the surface. Find people who share your values, passions, and vision for life.',
        features: [
            { icon: 'people', text: 'Curated profiles' },
            { icon: 'shield-checkmark', text: 'Verified users' },
            { icon: 'star', text: 'Smart matching' },
        ],
    },
    {
        id: '2',
        icon: 'flash',
        iconBg: ['#7B2FF7', '#F107A3'],
        badge: 'analytics',
        title: 'AI-Powered',
        highlight: 'Discovery',
        description: 'Our algorithm learns your preferences and surfaces profiles you\'ll actually want to meet.',
        features: [
            { icon: 'filter', text: 'Preference filters' },
            { icon: 'location', text: 'Nearby matches' },
            { icon: 'trending-up', text: 'Gets smarter daily' },
        ],
    },
    {
        id: '3',
        icon: 'lock-closed',
        iconBg: ['#11998e', '#38ef7d'],
        badge: 'checkmark-circle',
        title: 'Safe &',
        highlight: 'Private',
        description: 'Your data stays yours. End-to-end privacy, ghost mode, and verified profiles only.',
        features: [
            { icon: 'eye-off', text: 'Ghost mode' },
            { icon: 'chatbubbles', text: 'Secure chat' },
            { icon: 'hand-left', text: 'Block & report' },
        ],
    },
];

export default function OnboardingScreen() {
    const router = useRouter();
    const flatListRef = useRef<Animated.FlatList<Slide>>(null);
    const scrollX = useSharedValue(0);
    const [currentIndex, setCurrentIndex] = useState(0);

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (e) => { scrollX.value = e.contentOffset.x; },
    });

    const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
        if (viewableItems.length > 0 && viewableItems[0].index !== null) {
            setCurrentIndex(viewableItems[0].index!);
        }
    }).current;

    const handleNext = () => {
        if (currentIndex < SLIDES.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
        } else {
            router.replace('/login');
        }
    };

    const PaginationDot = ({ index }: { index: number }) => {
        const animStyle = useAnimatedStyle(() => {
            const range = [(index - 1) * width, index * width, (index + 1) * width];
            return {
                width: interpolate(scrollX.value, range, [8, 28, 8], Extrapolation.CLAMP),
                opacity: interpolate(scrollX.value, range, [0.4, 1, 0.4], Extrapolation.CLAMP),
            };
        });
        return <Animated.View style={[styles.dot, animStyle]} />;
    };

    const featurePositions = [
        { top: 20, left: 8 },
        { top: 20, right: 8 },
        { bottom: 20, left: '30%' as const },
    ];

    const SlideItem = ({ item }: { item: Slide }) => (
        <View style={styles.slide}>
            {/* Illustration */}
            <View style={styles.illustrationArea}>
                {/* Decorative rings */}
                <View style={styles.ring3} />
                <View style={styles.ring2} />
                <View style={styles.ring1} />

                {/* Main icon */}
                <LinearGradient colors={item.iconBg as any} style={styles.mainIconBg}>
                    <Ionicons name={item.icon} size={64} color="#fff" />
                </LinearGradient>

                {/* Floating feature cards */}
                {item.features.map((f, i) => (
                    <Animated.View
                        key={i}
                        entering={FadeInDown.delay(300 + i * 150).duration(600)}
                        style={[styles.featureCard, featurePositions[i] as any]}
                    >
                        <LinearGradient colors={item.iconBg as any} style={styles.featureIconBg}>
                            <Ionicons name={f.icon} size={14} color="#fff" />
                        </LinearGradient>
                        <Text style={styles.featureText}>{f.text}</Text>
                    </Animated.View>
                ))}
            </View>

            {/* Text */}
            <Animated.View entering={FadeInDown.delay(200).duration(700)} style={styles.textArea}>
                <Text style={styles.title}>
                    {item.title}{'\n'}
                    <Text style={styles.titleHighlight}>{item.highlight}</Text>
                </Text>
                <Text style={styles.description}>{item.description}</Text>
            </Animated.View>
        </View>
    );

    return (
        <View style={styles.container}>
            <LinearGradient colors={THEME.bg} style={StyleSheet.absoluteFill} />

            {/* Skip */}
            <TouchableOpacity style={styles.skipBtn} onPress={() => router.replace('/login')}>
                <Text style={styles.skipText}>Skip</Text>
                <Ionicons name="chevron-forward" size={16} color={THEME.muted} />
            </TouchableOpacity>

            {/* Slides */}
            <Animated.FlatList
                ref={flatListRef}
                data={SLIDES}
                renderItem={({ item }) => <SlideItem item={item} />}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
                style={{ flex: 1 }}
            />

            {/* Footer */}
            <View style={styles.footer}>
                <View style={styles.pagination}>
                    {SLIDES.map((_, i) => <PaginationDot key={i} index={i} />)}
                </View>

                <TouchableOpacity onPress={handleNext} activeOpacity={0.85} style={styles.nextBtnWrapper}>
                    <LinearGradient
                        colors={[THEME.accent, THEME.accentAlt]}
                        style={styles.nextBtn}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Text style={styles.nextText}>
                            {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Continue'}
                        </Text>
                        <Ionicons
                            name={currentIndex === SLIDES.length - 1 ? 'heart' : 'arrow-forward'}
                            size={20}
                            color="#fff"
                        />
                    </LinearGradient>
                </TouchableOpacity>

                <Text style={styles.footerNote}>
                    {currentIndex + 1} of {SLIDES.length}
                </Text>
            </View>
        </View>
    );
}

const featurePositions = [
    { top: '12%', left: '4%' },
    { top: '12%', right: '4%' },
    { bottom: '8%', left: '50%', transform: [{ translateX: -60 }] },
];

const styles = StyleSheet.create({
    container: { flex: 1 },
    skipBtn: {
        position: 'absolute',
        top: 56,
        right: 24,
        zIndex: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    skipText: { color: THEME.muted, fontSize: 15, fontWeight: '500' },
    slide: {
        width,
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 80,
    },
    illustrationArea: {
        height: height * 0.42,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    ring1: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 100,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    ring2: {
        position: 'absolute',
        width: 280,
        height: 280,
        borderRadius: 140,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    ring3: {
        position: 'absolute',
        width: 360,
        height: 360,
        borderRadius: 180,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.03)',
    },
    mainIconBg: {
        width: 140,
        height: 140,
        borderRadius: 70,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#FF6B6B',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 16,
    },
    featureCard: {
        position: 'absolute',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
        gap: 8,
    },
    featureIconBg: {
        width: 26,
        height: 26,
        borderRadius: 13,
        justifyContent: 'center',
        alignItems: 'center',
    },
    featureText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    textArea: { flex: 1, paddingTop: 32, gap: 12 },
    title: {
        fontSize: 38,
        fontWeight: '800',
        color: THEME.white,
        lineHeight: 46,
    },
    titleHighlight: { color: THEME.accent },
    description: {
        fontSize: 16,
        color: THEME.muted,
        lineHeight: 26,
    },
    footer: {
        paddingHorizontal: 24,
        paddingBottom: 48,
        gap: 20,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 6,
    },
    dot: {
        height: 8,
        borderRadius: 4,
        backgroundColor: THEME.accent,
    },
    nextBtnWrapper: {
        borderRadius: 18,
        overflow: 'hidden',
        shadowColor: THEME.accent,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.45,
        shadowRadius: 14,
        elevation: 10,
    },
    nextBtn: {
        height: 58,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 10,
        borderRadius: 18,
    },
    nextText: { color: '#fff', fontSize: 17, fontWeight: '800' },
    footerNote: {
        textAlign: 'center',
        color: THEME.muted,
        fontSize: 13,
    },
});
