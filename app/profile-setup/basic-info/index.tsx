import { useApp } from '@/context/AppContext';
import api from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import {
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
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

const GENDER_OPTIONS = [
    { label: 'Male', icon: 'man' as const },
    { label: 'Female', icon: 'woman' as const },
    { label: 'Other', icon: 'person' as const },
];

export default function ProfileBasicInfoScreen() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [day, setDay] = useState('');
    const [month, setMonth] = useState('');
    const [year, setYear] = useState('');
    const [gender, setGender] = useState<string | null>(null);
    const [errors, setErrors] = useState<{ name?: string; dob?: string; gender?: string }>({});
    const [nameFocused, setNameFocused] = useState(false);
    const [dobFocus, setDobFocus] = useState<'day' | 'month' | 'year' | null>(null);
    const { updateUserProfile } = useApp();

    const monthRef = useRef<TextInput>(null);
    const yearRef = useRef<TextInput>(null);

    const validate = () => {
        const e: typeof errors = {};
        if (name.trim().length < 2) e.name = 'Name must be at least 2 characters.';

        const d = parseInt(day, 10);
        const m = parseInt(month, 10);
        const y = parseInt(year, 10);

        if (!day || !month || !year || isNaN(d) || isNaN(m) || isNaN(y)
            || d < 1 || d > 31 || m < 1 || m > 12 || y < 1900 || y > new Date().getFullYear()) {
            e.dob = 'Enter a valid date (DD / MM / YYYY).';
        } else {
            const age = new Date().getFullYear() - new Date(y, m - 1, d).getFullYear();
            if (age < 18) e.dob = 'You must be at least 18 years old.';
        }

        if (!gender) e.gender = 'Please select your gender.';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleContinue = async () => {
        if (!validate()) return;
        try {
            const d = parseInt(day, 10);
            const m = parseInt(month, 10);
            const y = parseInt(year, 10);
            const dobISO = new Date(y, m - 1, d).toISOString().split('T')[0];
            const accessToken = await AsyncStorage.getItem('accessToken');
            if (!accessToken) { Alert.alert('Error', 'Not authenticated.'); router.replace('/login'); return; }
            const response = await api.createOrUpdateProfile(accessToken, { name, dob: dobISO, gender: gender || undefined });
            if (response.error) { Alert.alert('Error', response.error); return; }
            const age = new Date().getFullYear() - new Date(y, m - 1, d).getFullYear();
            updateUserProfile({ name, age });
            router.push('/profile-setup/photos');
        } catch { Alert.alert('Error', 'Failed to save profile data'); }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />
            <LinearGradient colors={THEME.bg} style={StyleSheet.absoluteFill} />

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

                        {/* Back */}
                        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={22} color={THEME.white} />
                        </TouchableOpacity>

                        {/* Header */}
                        <View style={styles.header}>
                            <View style={styles.progressBar}>
                                <View style={[styles.progressFill, { width: '33%' }]} />
                            </View>
                            <Text style={styles.stepLabel}>Step 1 of 3</Text>
                            <Text style={styles.title}>Tell us about{'\n'}<Text style={styles.titleAccent}>yourself</Text></Text>
                            <Text style={styles.subtitle}>This helps us find your best matches.</Text>
                        </View>

                        {/* Card */}
                        <View style={styles.card}>
                            {/* Name */}
                            <View>
                                <Text style={styles.label}>Full Name</Text>
                                <View style={[styles.inputRow, nameFocused && styles.inputFocused]}>
                                    <Ionicons name="person-outline" size={18} color={nameFocused ? THEME.accent : THEME.muted} style={{ marginRight: 10 }} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Your full name"
                                        placeholderTextColor={THEME.muted}
                                        value={name}
                                        onChangeText={t => { setName(t); if (errors.name) setErrors(p => ({ ...p, name: undefined })); }}
                                        autoCapitalize="words"
                                        onFocus={() => setNameFocused(true)}
                                        onBlur={() => setNameFocused(false)}
                                    />
                                </View>
                                {errors.name && <Text style={styles.error}>{errors.name}</Text>}
                            </View>

                            {/* DOB — three separate boxes with visible "/" separators */}
                            <View>
                                <Text style={styles.label}>Date of Birth</Text>
                                <View style={[styles.dobRow, dobFocus && styles.inputFocused]}>
                                    <Ionicons name="calendar-outline" size={18} color={dobFocus ? THEME.accent : THEME.muted} style={{ marginRight: 10 }} />
                                    {/* Day */}
                                    <TextInput
                                        style={[styles.dobBox, { width: 44 }]}
                                        placeholder="DD"
                                        placeholderTextColor={THEME.muted}
                                        value={day}
                                        onChangeText={t => {
                                            const v = t.replace(/\D/g, '').slice(0, 2);
                                            setDay(v);
                                            if (errors.dob) setErrors(p => ({ ...p, dob: undefined }));
                                            if (v.length === 2) monthRef.current?.focus();
                                        }}
                                        keyboardType="number-pad"
                                        maxLength={2}
                                        onFocus={() => setDobFocus('day')}
                                        onBlur={() => setDobFocus(null)}
                                        returnKeyType="next"
                                    />
                                    <Text style={styles.dobSep}>/</Text>
                                    {/* Month */}
                                    <TextInput
                                        ref={monthRef}
                                        style={[styles.dobBox, { width: 44 }]}
                                        placeholder="MM"
                                        placeholderTextColor={THEME.muted}
                                        value={month}
                                        onChangeText={t => {
                                            const v = t.replace(/\D/g, '').slice(0, 2);
                                            setMonth(v);
                                            if (errors.dob) setErrors(p => ({ ...p, dob: undefined }));
                                            if (v.length === 2) yearRef.current?.focus();
                                        }}
                                        keyboardType="number-pad"
                                        maxLength={2}
                                        onFocus={() => setDobFocus('month')}
                                        onBlur={() => setDobFocus(null)}
                                        returnKeyType="next"
                                    />
                                    <Text style={styles.dobSep}>/</Text>
                                    {/* Year */}
                                    <TextInput
                                        ref={yearRef}
                                        style={[styles.dobBox, { width: 64 }]}
                                        placeholder="YYYY"
                                        placeholderTextColor={THEME.muted}
                                        value={year}
                                        onChangeText={t => {
                                            const v = t.replace(/\D/g, '').slice(0, 4);
                                            setYear(v);
                                            if (errors.dob) setErrors(p => ({ ...p, dob: undefined }));
                                        }}
                                        keyboardType="number-pad"
                                        maxLength={4}
                                        onFocus={() => setDobFocus('year')}
                                        onBlur={() => setDobFocus(null)}
                                        returnKeyType="done"
                                    />
                                </View>
                                {errors.dob && <Text style={styles.error}>{errors.dob}</Text>}
                            </View>

                            {/* Gender */}
                            <View>
                                <Text style={styles.label}>Gender</Text>
                                <View style={styles.genderRow}>
                                    {GENDER_OPTIONS.map(opt => {
                                        const sel = gender === opt.label;
                                        return (
                                            <TouchableOpacity
                                                key={opt.label}
                                                style={[styles.genderCard, sel && styles.genderCardSel]}
                                                onPress={() => { setGender(opt.label); if (errors.gender) setErrors(p => ({ ...p, gender: undefined })); }}
                                                activeOpacity={0.75}
                                            >
                                                {sel && <LinearGradient colors={[THEME.accent, THEME.accentAlt]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />}
                                                <Ionicons name={opt.icon} size={22} color={sel ? '#fff' : THEME.muted} />
                                                <Text style={[styles.genderLabel, sel && styles.genderLabelSel]}>{opt.label}</Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                                {errors.gender && <Text style={styles.error}>{errors.gender}</Text>}
                            </View>
                        </View>

                        {/* CTA */}
                        <TouchableOpacity onPress={handleContinue} activeOpacity={0.85} style={styles.btnWrapper}>
                            <LinearGradient colors={[THEME.accent, THEME.accentAlt]} style={styles.btn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                <Text style={styles.btnText}>Continue</Text>
                                <Ionicons name="arrow-forward" size={20} color="#fff" />
                            </LinearGradient>
                        </TouchableOpacity>

                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { paddingHorizontal: 24, paddingBottom: 48 },
    backBtn: {
        marginTop: 16, marginBottom: 24, width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center',
    },
    header: { marginBottom: 24, gap: 10 },
    progressBar: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: THEME.accent, borderRadius: 2 },
    stepLabel: { fontSize: 13, color: THEME.accent, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
    title: { fontSize: 34, fontWeight: '800', color: '#fff', lineHeight: 42 },
    titleAccent: { color: THEME.accent },
    subtitle: { fontSize: 15, color: THEME.muted, lineHeight: 22 },
    card: {
        backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 24, padding: 24,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', gap: 20, marginBottom: 24,
    },
    label: { fontSize: 13, color: THEME.muted, fontWeight: '600', marginBottom: 8, letterSpacing: 0.5 },
    inputRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14,
        borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 14, height: 52,
    },
    inputFocused: { borderColor: THEME.accent, backgroundColor: 'rgba(255,107,107,0.08)' },
    input: { flex: 1, color: '#fff', fontSize: 16 },
    // DOB three-box layout
    dobRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14,
        borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 14, height: 52,
    },
    dobBox: {
        color: '#fff', fontSize: 18, fontWeight: '600', textAlign: 'center',
        paddingVertical: 0,
    },
    dobSep: {
        color: THEME.accent,
        fontSize: 22,
        fontWeight: '800',
        marginHorizontal: 4,
        lineHeight: 26,
    },
    error: { color: THEME.accent, fontSize: 12, marginTop: 6 },
    genderRow: { flexDirection: 'row', gap: 10 },
    genderCard: {
        flex: 1, paddingVertical: 16, borderRadius: 14, alignItems: 'center', gap: 6,
        backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.12)', overflow: 'hidden',
    },
    genderCardSel: { borderColor: THEME.accent },
    genderLabel: { fontSize: 13, color: THEME.muted, fontWeight: '600' },
    genderLabelSel: { color: '#fff', fontWeight: '700' },
    btnWrapper: {
        borderRadius: 16, overflow: 'hidden',
        shadowColor: THEME.accent, shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
    },
    btn: { height: 56, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
    btnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
