import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PremiumFeature {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    description: string;
}

const FEATURES: PremiumFeature[] = [
    { icon: 'infinite', title: 'Unlimited Swipes', description: 'Never run out of daily swipes' },
    { icon: 'heart', title: 'See Who Liked You', description: 'View all profiles who liked you' },
    { icon: 'flash', title: 'Boost', description: 'Be seen by 10× more people for 30 min' },
    { icon: 'locate', title: 'Extended Radius', description: 'Discover people up to 50 km away' },
];

interface Props {
    visible: boolean;
    onClose: () => void;
    reason?: 'swipe_limit' | 'likes' | 'filter' | 'default';
    onUpgrade?: () => void;
}

const REASON_TEXT: Record<string, { title: string; subtitle: string }> = {
    swipe_limit: {
        title: "You've reached your daily limit",
        subtitle: "Upgrade to PREMIUM for unlimited swipes every day",
    },
    likes: {
        title: 'See who already likes you',
        subtitle: 'Unlock full profiles — stop guessing, start matching',
    },
    filter: {
        title: 'Premium Filters',
        subtitle: 'Filter by height, education, lifestyle and more',
    },
    default: {
        title: 'Unlock Premium',
        subtitle: 'Get the most out of WhatsLeft with Premium features',
    },
};

export default function PremiumModal({ visible, onClose, reason = 'default', onUpgrade }: Props) {
    const router = useRouter();
    const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const handleUpgradePress = () => {
        onClose();                         // close modal first
        if (onUpgrade) {
            onUpgrade();
        } else {
            // slight delay so modal close animation doesn't fight navigation
            setTimeout(() => router.push('/premium'), 250);
        }
    };

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
                Animated.spring(slideAnim, { toValue: 0, tension: 68, friction: 11, useNativeDriver: true }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
                Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }),
            ]).start();
        }
    }, [visible]);

    const { title, subtitle } = REASON_TEXT[reason] ?? REASON_TEXT.default;

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
            {/* Backdrop */}
            <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
                <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
            </Animated.View>

            {/* Sheet */}
            <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
                <LinearGradient colors={['#1a1729', '#0f0c29']} style={styles.sheetInner}>
                    {/* Handle */}
                    <View style={styles.handle} />

                    {/* Crown icon */}
                    <LinearGradient colors={['#FF6B6B', '#FF8E53']} style={styles.crownBg}>
                        <Ionicons name="diamond" size={32} color="#fff" />
                    </LinearGradient>

                    <Text style={styles.badge}>PREMIUM</Text>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.subtitle}>{subtitle}</Text>

                    {/* Feature list */}
                    <View style={styles.features}>
                        {FEATURES.map((f) => (
                            <View key={f.icon} style={styles.featureRow}>
                                <LinearGradient colors={['rgba(255,107,107,0.18)', 'rgba(255,142,83,0.10)']} style={styles.featureIcon}>
                                    <Ionicons name={f.icon} size={18} color="#FF6B6B" />
                                </LinearGradient>
                                <View style={styles.featureText}>
                                    <Text style={styles.featureTitle}>{f.title}</Text>
                                    <Text style={styles.featureDesc}>{f.description}</Text>
                                </View>
                                <Ionicons name="checkmark-circle" size={20} color="#FF6B6B" />
                            </View>
                        ))}
                    </View>

                    {/* CTA */}
                    <TouchableOpacity style={styles.ctaBtn} onPress={handleUpgradePress} activeOpacity={0.85}>
                        <LinearGradient
                            colors={['#FF6B6B', '#FF8E53']}
                            style={styles.ctaGrad}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Ionicons name="diamond" size={18} color="#fff" />
                            <Text style={styles.ctaText}>Upgrade to Premium</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={onClose} style={styles.skipBtn}>
                        <Text style={styles.skipText}>Maybe later</Text>
                    </TouchableOpacity>
                </LinearGradient>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.65)',
    },
    sheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        overflow: 'hidden',
    },
    sheetInner: {
        padding: 24,
        paddingBottom: 40,
        alignItems: 'center',
    },
    handle: {
        width: 40, height: 4, borderRadius: 2,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginBottom: 20,
    },
    crownBg: {
        width: 72, height: 72, borderRadius: 36,
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 12,
    },
    badge: {
        fontSize: 11, fontWeight: '800', letterSpacing: 2,
        color: '#FF6B6B', marginBottom: 8,
    },
    title: {
        fontSize: 22, fontWeight: '800', color: '#fff',
        textAlign: 'center', marginBottom: 6,
    },
    subtitle: {
        fontSize: 14, color: 'rgba(255,255,255,0.55)',
        textAlign: 'center', lineHeight: 20, marginBottom: 24,
        paddingHorizontal: 16,
    },
    features: { width: '100%', gap: 12, marginBottom: 24 },
    featureRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 14, padding: 12, gap: 12,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    },
    featureIcon: {
        width: 40, height: 40, borderRadius: 12,
        justifyContent: 'center', alignItems: 'center',
    },
    featureText: { flex: 1 },
    featureTitle: { fontSize: 14, fontWeight: '700', color: '#fff' },
    featureDesc: { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
    ctaBtn: { width: '100%', borderRadius: 28, overflow: 'hidden', marginBottom: 12 },
    ctaGrad: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, paddingVertical: 16,
    },
    ctaText: { color: '#fff', fontSize: 17, fontWeight: '800' },
    skipBtn: { paddingVertical: 8 },
    skipText: { color: 'rgba(255,255,255,0.35)', fontSize: 14 },
});
