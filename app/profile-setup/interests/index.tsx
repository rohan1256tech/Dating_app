import { useApp } from '@/context/AppContext';
import api from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const THEME = {
    bg: ['#0f0c29', '#302b63', '#24243e'] as const,
    accent: '#FF6B6B',
    accentAlt: '#FF8E53',
    white: '#FFFFFF',
    muted: 'rgba(255,255,255,0.55)',
    card: 'rgba(255,255,255,0.07)',
    border: 'rgba(255,255,255,0.12)',
};

const LOOKING_FOR_OPTIONS = [
    { label: 'Women', icon: 'woman' as const, value: 'Women' },
    { label: 'Men', icon: 'man' as const, value: 'Men' },
    { label: 'Everyone', icon: 'people' as const, value: 'Everyone' },
];

const INTERESTS = [
    'Photography', 'Cooking', 'Hiking', 'Gaming', 'Art',
    'Music', 'Travel', 'Tech', 'Fitness', 'Reading',
    'Movies', 'Dancing', 'Yoga', 'Writing', 'Sports',
    'Fashion', 'Foodie', 'Animals', 'Nature', 'Cars',
];

export default function ProfileInterestsScreen() {
    const router = useRouter();
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
    const [lookingFor, setLookingFor] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const { updateUserProfile } = useApp();

    const toggleInterest = (interest: string) => {
        if (selectedInterests.includes(interest)) {
            setSelectedInterests(prev => prev.filter(i => i !== interest));
        } else if (selectedInterests.length < 5) {
            setSelectedInterests(prev => [...prev, interest]);
        }
    };

    const handleContinue = async () => {
        if (!lookingFor) { Alert.alert('Required', "Please select who you're looking for."); return; }
        if (selectedInterests.length < 3) { Alert.alert('Select Interests', 'Please select at least 3 interests.'); return; }
        try {
            setLoading(true);
            const accessToken = await AsyncStorage.getItem('accessToken');
            if (!accessToken) { Alert.alert('Error', 'Not authenticated.'); router.replace('/login'); return; }
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Location Required', 'Location permission is needed to find matches nearby.');
                setLoading(false); return;
            }
            const location = await Location.getCurrentPositionAsync({});
            const response = await api.createOrUpdateProfile(accessToken, {
                interests: selectedInterests,
                lookingFor,
                location: { latitude: location.coords.latitude, longitude: location.coords.longitude },
            });
            if (response.error) { Alert.alert('Error', response.error); setLoading(false); return; }
            updateUserProfile({ interests: selectedInterests });
            setLoading(false);
            router.replace('/(tabs)');
        } catch {
            setLoading(false);
            Alert.alert('Error', 'Failed to complete profile setup');
        }
    };

    const canContinue = lookingFor !== '' && selectedInterests.length >= 3;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />
            <LinearGradient colors={THEME.bg} style={StyleSheet.absoluteFill} />

            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                <View style={styles.content}>

                    {/* Back */}
                    <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={22} color={THEME.white} />
                    </TouchableOpacity>

                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: '100%' }]} />
                        </View>
                        <Text style={styles.stepLabel}>Step 3 of 3 · Final Step</Text>
                        <Text style={styles.title}>Your <Text style={styles.titleAccent}>Vibe</Text></Text>
                        <Text style={styles.subtitle}>Tell us who you're looking for and what you love.</Text>
                    </View>

                    {/* Looking For */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>I'm looking for</Text>
                        <View style={styles.lookingForRow}>
                            {LOOKING_FOR_OPTIONS.map(opt => {
                                const sel = lookingFor === opt.value;
                                return (
                                    <TouchableOpacity
                                        key={opt.value}
                                        style={[styles.lookingCard, sel && styles.lookingCardSel]}
                                        onPress={() => setLookingFor(opt.value)}
                                        activeOpacity={0.75}
                                    >
                                        {sel && <LinearGradient colors={[THEME.accent, THEME.accentAlt]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />}
                                        <Ionicons name={opt.icon} size={26} color={sel ? '#fff' : THEME.muted} />
                                        <Text style={[styles.lookingLabel, sel && styles.lookingLabelSel]}>{opt.label}</Text>
                                        {sel && (
                                            <View style={styles.checkBadge}>
                                                <Ionicons name="checkmark" size={10} color="#fff" />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Interests */}
                    <View style={styles.section}>
                        <View style={styles.sectionTitleRow}>
                            <Text style={styles.sectionTitle}>My interests</Text>
                            <View style={styles.counterBadge}>
                                <Text style={styles.counterText}>{selectedInterests.length}/5</Text>
                            </View>
                        </View>
                        <Text style={styles.sectionHint}>Pick at least 3 things you love</Text>
                        <View style={styles.chips}>
                            {INTERESTS.map(interest => {
                                const sel = selectedInterests.includes(interest);
                                return (
                                    <TouchableOpacity
                                        key={interest}
                                        style={[styles.chip, sel && styles.chipSel]}
                                        onPress={() => toggleInterest(interest)}
                                        activeOpacity={0.7}
                                    >
                                        {sel && <LinearGradient colors={[THEME.accent, THEME.accentAlt]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />}
                                        <Text style={[styles.chipText, sel && styles.chipTextSel]}>{interest}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* CTA */}
                    <TouchableOpacity
                        onPress={handleContinue}
                        disabled={!canContinue || loading}
                        activeOpacity={0.85}
                        style={[styles.btnWrapper, !canContinue && styles.btnDisabled]}
                    >
                        <LinearGradient
                            colors={canContinue ? [THEME.accent, THEME.accentAlt] : ['#444', '#333']}
                            style={styles.btn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        >
                            <Ionicons name={loading ? 'hourglass' : 'heart'} size={20} color="#fff" />
                            <Text style={styles.btnText}>{loading ? 'Setting up...' : 'Start Dating'}</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { flex: 1 },
    content: { paddingHorizontal: 24, paddingBottom: 48 },
    backBtn: {
        marginTop: 16, marginBottom: 20, width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center',
    },
    header: { marginBottom: 28, gap: 8 },
    progressBar: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: THEME.accent, borderRadius: 2 },
    stepLabel: { fontSize: 13, color: THEME.accent, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
    title: { fontSize: 34, fontWeight: '800', color: '#fff', lineHeight: 42 },
    titleAccent: { color: THEME.accent },
    subtitle: { fontSize: 15, color: THEME.muted, lineHeight: 22 },
    section: { marginBottom: 28 },
    sectionTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 14 },
    sectionHint: { fontSize: 13, color: THEME.muted, marginBottom: 14, marginTop: -10 },
    counterBadge: {
        backgroundColor: 'rgba(255,107,107,0.15)', borderRadius: 12,
        paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(255,107,107,0.3)',
    },
    counterText: { color: THEME.accent, fontSize: 13, fontWeight: '700' },
    lookingForRow: { flexDirection: 'row', gap: 10 },
    lookingCard: {
        flex: 1, paddingVertical: 18, borderRadius: 16, alignItems: 'center', gap: 8,
        backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.12)', overflow: 'hidden', position: 'relative',
    },
    lookingCardSel: { borderColor: THEME.accent },
    lookingLabel: { fontSize: 13, fontWeight: '600', color: THEME.muted },
    lookingLabelSel: { color: '#fff', fontWeight: '700' },
    checkBadge: {
        position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: 9,
        backgroundColor: 'rgba(255,255,255,0.25)', justifyContent: 'center', alignItems: 'center',
    },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    chip: {
        paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24,
        borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)',
        backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden',
    },
    chipSel: { borderColor: THEME.accent },
    chipText: { fontSize: 14, color: THEME.muted, fontWeight: '500' },
    chipTextSel: { color: '#fff', fontWeight: '700' },
    btnWrapper: {
        borderRadius: 16, overflow: 'hidden',
        shadowColor: THEME.accent, shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
    },
    btnDisabled: { shadowOpacity: 0 },
    btn: { height: 56, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
    btnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
