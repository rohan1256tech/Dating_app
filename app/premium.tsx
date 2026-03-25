import { api } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    fetchProducts,
    finishTransaction,
    initConnection,
    purchaseErrorListener,
    purchaseUpdatedListener,
    type ProductSubscription,
    type Purchase,
    type PurchaseError,
} from 'react-native-iap';
import Animated, {
    FadeInDown,
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Product IDs — must exactly match subscriptions created in Google Play Console ─
// Play Console → your app → Monetise → Subscriptions → Create
const SKUS = {
    monthly: 'whatsleft_premium_monthly',
    quarterly: 'whatsleft_premium_quarterly',
    annual: 'whatsleft_premium_annual',
} as const;

// Android base-plan IDs (must be set in Play Console for each subscription)
const BASE_PLAN_IDS = {
    monthly: 'monthly-base',
    quarterly: 'quarterly-base',
    annual: 'annual-base',
} as const;

const APP_PACKAGE = 'com.yourname.whatsleft'; // must match app.json android.package

const PLANS = [
    { id: 'monthly', sku: SKUS.monthly, basePlanId: BASE_PLAN_IDS.monthly, label: 'Monthly', defaultPrice: '₹49', per: '/month', durationDays: 30, tag: null, colors: ['rgba(255,107,107,0.12)', 'rgba(255,142,83,0.06)'] as const },
    { id: 'quarterly', sku: SKUS.quarterly, basePlanId: BASE_PLAN_IDS.quarterly, label: '3 Months', defaultPrice: '₹139', per: '/3 months', durationDays: 90, tag: 'BEST VALUE', colors: ['rgba(255,107,107,0.22)', 'rgba(255,142,83,0.14)'] as const },
    { id: 'annual', sku: SKUS.annual, basePlanId: BASE_PLAN_IDS.annual, label: 'Annual', defaultPrice: '₹499', per: '/year', durationDays: 365, tag: 'SAVE 15%', colors: ['rgba(255,107,107,0.10)', 'rgba(255,142,83,0.05)'] as const },
];

const FEATURES = [
    { icon: 'infinite' as const, title: 'Unlimited Swipes', desc: 'Never hit a daily limit again' },
    { icon: 'eye' as const, title: 'See Who Liked You', desc: 'Full profile reveals, no blur' },
    { icon: 'flash' as const, title: 'Profile Boost', desc: 'Be seen 10× more — 30 min blast' },
    { icon: 'location' as const, title: '50 km Radius', desc: 'Discover people far and wide' },
    { icon: 'star' as const, title: 'Superlikes', desc: '5 superlikes per day' },
    { icon: 'shield-checkmark' as const, title: 'Priority Support', desc: 'Jump the queue every time' },
];

export default function PremiumScreen() {
    const router = useRouter();
    const [selectedPlan, setSelectedPlan] = useState('quarterly');
    const [currentPlan, setCurrentPlan] = useState<string>('FREE');
    const [purchasing, setPurchasing] = useState(false);
    const [iapReady, setIapReady] = useState(false);
    const [products, setProducts] = useState<ProductSubscription[]>([]);

    // Keep listeners in refs so they stay stable across re-renders
    const purchaseUpdateSub = useRef<{ remove(): void } | null>(null);
    const purchaseErrorSub = useRef<{ remove(): void } | null>(null);

    const glow = useSharedValue(0.7);

    useEffect(() => {
        glow.value = withRepeat(withSequence(withTiming(1, { duration: 1500 }), withTiming(0.7, { duration: 1500 })), -1);
        loadCurrentPlan();
        setupIAP();
        return () => {
            purchaseUpdateSub.current?.remove();
            purchaseErrorSub.current?.remove();
        };
    }, []);

    const loadCurrentPlan = async () => {
        try {
            const token = await AsyncStorage.getItem('accessToken');
            if (!token) return;
            const res = await api.getSubscriptionStatus(token);
            if (res.data) setCurrentPlan(res.data.plan);
        } catch { /* silent */ }
    };

    const handlePurchaseSuccess = useCallback(async (purchase: Purchase) => {
        try {
            const purchaseToken = (purchase as any).purchaseToken as string | undefined;
            if (!purchaseToken) {
                await finishTransaction({ purchase, isConsumable: false });
                return;
            }

            const token = await AsyncStorage.getItem('accessToken');
            if (!token) return;

            const response = await api.verifyIAPPurchase(token, {
                purchaseToken,
                productId: purchase.productId,
                packageName: APP_PACKAGE,
            });

            if (response.data?.success) {
                await finishTransaction({ purchase, isConsumable: false });
                setCurrentPlan('PREMIUM');
                Alert.alert(
                    '🎉 Welcome to Premium!',
                    'Your subscription is now active. Enjoy unlimited features!',
                    [{ text: "Let's Go!", onPress: () => router.back() }]
                );
            } else {
                Alert.alert('Verification Failed', 'Purchase recorded but verification failed. Contact support.');
            }
        } catch (err: any) {
            console.error('[IAP] Purchase verification error:', err);
            Alert.alert('Error', 'Something went wrong verifying your purchase. Please contact support.');
        } finally {
            setPurchasing(false);
        }
    }, []);

    const setupIAP = async () => {
        try {
            await initConnection();
            setIapReady(true);

            // Attach purchase listeners
            purchaseUpdateSub.current = purchaseUpdatedListener((purchase: Purchase) => {
                setPurchasing(true);
                handlePurchaseSuccess(purchase);
            });

            purchaseErrorSub.current = purchaseErrorListener((error: PurchaseError) => {
                setPurchasing(false);
                if (String(error.code) !== 'E_USER_CANCELLED') {
                    Alert.alert('Purchase Error', error.message ?? 'Unknown error');
                }
            });

            // Load real prices from Play Store
            const subs = await fetchProducts({
                skus: Object.values(SKUS),
                type: 'subs',
            });
            setProducts(subs as ProductSubscription[]);
        } catch (err) {
            // Normal in Expo Go — will work in EAS/Play Store build
            console.log('[IAP] Not available (Expo Go or simulator):', err);
        }
    };

    const handleUpgrade = useCallback(async () => {
        if (!iapReady) {
            Alert.alert(
                'Not Available',
                'Purchases are only available in the Play Store build. Install via Play Store to subscribe.'
            );
            return;
        }

        try {
            setPurchasing(true);
            const plan = PLANS.find(p => p.id === selectedPlan)!;

            const { requestPurchase } = await import('react-native-iap');
            await requestPurchase({
                type: 'subs',
                request: Platform.OS === 'android' ? {
                    android: {
                        skus: [plan.sku],
                        subscriptionOffers: [{ sku: plan.sku, offerToken: plan.basePlanId }],
                    }
                } : {
                    apple: { sku: plan.sku }
                }
            });
            // purchaseUpdatedListener handles the rest
        } catch (err: any) {
            setPurchasing(false);
            if (err?.code !== 'E_USER_CANCELLED') {
                Alert.alert('Error', 'Could not initiate purchase. Try again.');
            }
        }
    }, [iapReady, selectedPlan]);

    // Get localised price from Play Store if loaded, fallback to default
    const getPlanPrice = (plan: typeof PLANS[0]) => {
        const product = products.find(p => p.id === plan.sku);
        return (product as any)?.localizedPrice ?? plan.defaultPrice;
    };

    const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));
    const isPremium = currentPlan === 'PREMIUM';

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />
            <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={StyleSheet.absoluteFill} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Premium</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                <Animated.View entering={FadeInUp.duration(600)} style={styles.hero}>
                    <Animated.View style={[styles.glowRing, glowStyle]} />
                    <LinearGradient colors={['#FF6B6B', '#FF8E53']} style={styles.crownBg}>
                        <Ionicons name="diamond" size={40} color="#fff" />
                    </LinearGradient>
                    <Text style={styles.badge}>WHATSLEFT PREMIUM</Text>
                    <Text style={styles.heroTitle}>
                        {isPremium ? "You're Premium! 🎉" : 'Upgrade & Find Your Match Faster'}
                    </Text>
                    <Text style={styles.heroSub}>
                        {isPremium ? 'Enjoy unlimited access to all premium features' : 'Unlock everything WhatsLeft has to offer'}
                    </Text>
                </Animated.View>

                <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.featuresSection}>
                    {FEATURES.map((f, i) => (
                        <Animated.View key={f.icon} entering={FadeInDown.delay(150 + i * 60).duration(500)} style={styles.featureRow}>
                            <LinearGradient colors={['rgba(255,107,107,0.2)', 'rgba(255,142,83,0.1)']} style={styles.featureIcon}>
                                <Ionicons name={f.icon} size={20} color="#FF6B6B" />
                            </LinearGradient>
                            <View style={styles.featureText}>
                                <Text style={styles.featureTitle}>{f.title}</Text>
                                <Text style={styles.featureDesc}>{f.desc}</Text>
                            </View>
                            {isPremium && <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />}
                        </Animated.View>
                    ))}
                </Animated.View>

                {!isPremium && (
                    <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.plansSection}>
                        <Text style={styles.sectionTitle}>Choose your plan</Text>
                        <View style={styles.plans}>
                            {PLANS.map((plan) => {
                                const selected = selectedPlan === plan.id;
                                return (
                                    <TouchableOpacity key={plan.id} onPress={() => setSelectedPlan(plan.id)} activeOpacity={0.8}
                                        style={[styles.planCard, selected && styles.planCardSelected]}>
                                        <LinearGradient colors={plan.colors} style={styles.planGrad}>
                                            {plan.tag && (
                                                <LinearGradient colors={['#FF6B6B', '#FF8E53']} style={styles.planTag}>
                                                    <Text style={styles.planTagText}>{plan.tag}</Text>
                                                </LinearGradient>
                                            )}
                                            <Text style={styles.planLabel}>{plan.label}</Text>
                                            <Text style={styles.planPrice}>{getPlanPrice(plan)}</Text>
                                            <Text style={styles.planPer}>{plan.per}</Text>
                                            {selected && <View style={styles.checkmark}><Ionicons name="checkmark-circle" size={20} color="#FF6B6B" /></View>}
                                        </LinearGradient>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        <TouchableOpacity style={[styles.ctaBtn, purchasing && { opacity: 0.7 }]}
                            onPress={handleUpgrade} activeOpacity={0.85} disabled={purchasing}>
                            <LinearGradient colors={['#FF6B6B', '#FF8E53']} style={styles.ctaGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                {purchasing ? <ActivityIndicator color="#fff" size="small" /> : (
                                    <>
                                        <Ionicons name="diamond" size={20} color="#fff" />
                                        <Text style={styles.ctaText}>
                                            Subscribe — {getPlanPrice(PLANS.find(p => p.id === selectedPlan)!)}
                                        </Text>
                                    </>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <Text style={styles.legal}>
                            Subscription auto-renews. Cancel anytime in Google Play → Subscriptions.{'\n'}
                            Payment processed by Google Play Billing. By subscribing you agree to our Terms.
                        </Text>
                    </Animated.View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
    backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
    scroll: { paddingBottom: 48 },
    hero: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24 },
    glowRing: { position: 'absolute', top: 16, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,107,107,0.15)' },
    crownBg: { width: 88, height: 88, borderRadius: 44, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    badge: { fontSize: 11, fontWeight: '800', letterSpacing: 2.5, color: '#FF6B6B', marginBottom: 10 },
    heroTitle: { fontSize: 26, fontWeight: '800', color: '#fff', textAlign: 'center', lineHeight: 34, marginBottom: 8 },
    heroSub: { fontSize: 15, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 22 },
    featuresSection: { paddingHorizontal: 20, gap: 10, marginBottom: 8 },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
    featureIcon: { width: 44, height: 44, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
    featureText: { flex: 1 },
    featureTitle: { fontSize: 14, fontWeight: '700', color: '#fff' },
    featureDesc: { fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
    plansSection: { paddingHorizontal: 20, marginTop: 24 },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 14 },
    plans: { flexDirection: 'row', gap: 10, marginBottom: 24 },
    planCard: { flex: 1, borderRadius: 18, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(255,255,255,0.1)' },
    planCardSelected: { borderColor: '#FF6B6B' },
    planGrad: { padding: 14, alignItems: 'center', minHeight: 120, justifyContent: 'center' },
    planTag: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 6 },
    planTagText: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 1 },
    planLabel: { fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: '600', marginBottom: 6 },
    planPrice: { fontSize: 22, fontWeight: '800', color: '#fff' },
    planPer: { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
    checkmark: { position: 'absolute', top: 8, right: 8 },
    ctaBtn: { borderRadius: 28, overflow: 'hidden', marginBottom: 14, elevation: 8, shadowColor: '#FF6B6B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12 },
    ctaGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18 },
    ctaText: { color: '#fff', fontSize: 16, fontWeight: '800' },
    legal: { fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center', lineHeight: 16 },
});
