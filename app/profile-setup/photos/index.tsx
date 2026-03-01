import { useApp } from '@/context/AppContext';
import api from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    SafeAreaView,
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
};

export default function ProfilePhotosScreen() {
    const router = useRouter();
    const [photos, setPhotos] = useState<(string | null)[]>(Array(6).fill(null));
    const [uploading, setUploading] = useState(false);
    const { updateUserProfile } = useApp();

    const pickImage = async (index: number) => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permission Denied', 'Camera roll permission is required.'); return; }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'], allowsEditing: true, aspect: [4, 5], quality: 0.9,
        });
        if (!result.canceled) {
            const newPhotos = [...photos];
            newPhotos[index] = result.assets[0].uri;
            setPhotos(newPhotos);
        }
    };

    const removeImage = (index: number) => {
        const newPhotos = [...photos];
        newPhotos[index] = null;
        setPhotos(newPhotos);
    };

    const handleContinue = async () => {
        const selected = photos.filter(p => p !== null);
        if (selected.length === 0) { Alert.alert('Add Photos', 'Please add at least one photo.'); return; }
        try {
            setUploading(true);
            const accessToken = await AsyncStorage.getItem('accessToken');
            if (!accessToken) { Alert.alert('Error', 'Not authenticated.'); router.replace('/login'); return; }
            for (const uri of selected) {
                if (uri) {
                    const res = await api.uploadPhoto(accessToken, uri);
                    if (res.error) { Alert.alert('Upload Error', res.error); setUploading(false); return; }
                }
            }
            updateUserProfile({ photos });
            setUploading(false);
            router.push('/profile-setup/interests');
        } catch { setUploading(false); Alert.alert('Error', 'Failed to upload photos'); }
    };

    const filledCount = photos.filter(p => p !== null).length;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />
            <LinearGradient colors={THEME.bg} style={StyleSheet.absoluteFill} />

            <View style={styles.content}>
                {/* Back */}
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={22} color={THEME.white} />
                </TouchableOpacity>

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: '66%' }]} />
                    </View>
                    <Text style={styles.stepLabel}>Step 2 of 3</Text>
                    <Text style={styles.title}>Your best{'\n'}<Text style={styles.titleAccent}>photos</Text></Text>
                    <Text style={styles.subtitle}>Add at least 1 photo. First impressions matter!</Text>
                </View>

                {/* Photo count badge */}
                <View style={styles.countRow}>
                    <View style={styles.countBadge}>
                        <Ionicons name="images-outline" size={16} color={THEME.accent} />
                        <Text style={styles.countText}>{filledCount} / 6 added</Text>
                    </View>
                </View>

                {/* Grid */}
                <View style={styles.grid}>
                    {photos.map((photo, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[styles.slot, index === 0 && styles.slotMain]}
                            onPress={() => !photo && pickImage(index)}
                            activeOpacity={0.8}
                        >
                            {photo ? (
                                <>
                                    <Image source={{ uri: photo }} style={styles.image} />
                                    <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(index)}>
                                        <Ionicons name="close" size={14} color="#fff" />
                                    </TouchableOpacity>
                                    {index === 0 && (
                                        <View style={styles.mainBadge}>
                                            <Text style={styles.mainBadgeText}>Main</Text>
                                        </View>
                                    )}
                                </>
                            ) : (
                                <View style={styles.placeholder}>
                                    <LinearGradient colors={['rgba(255,107,107,0.15)', 'rgba(255,142,83,0.08)']} style={styles.placeholderGrad}>
                                        <Ionicons name="add" size={index === 0 ? 40 : 28} color={THEME.accent} />
                                        {index === 0 && <Text style={styles.placeholderText}>Add main photo</Text>}
                                    </LinearGradient>
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* CTA */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        onPress={handleContinue}
                        disabled={filledCount === 0 || uploading}
                        activeOpacity={0.85}
                        style={[styles.btnWrapper, filledCount === 0 && styles.btnDisabled]}
                    >
                        <LinearGradient
                            colors={filledCount > 0 ? [THEME.accent, THEME.accentAlt] : ['#444', '#333']}
                            style={styles.btn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                        >
                            <Text style={styles.btnText}>{uploading ? 'Uploading...' : 'Continue'}</Text>
                            {!uploading && <Ionicons name="arrow-forward" size={20} color="#fff" />}
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { flex: 1, paddingHorizontal: 24, paddingBottom: 24 },
    backBtn: {
        marginTop: 16, marginBottom: 20, width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center',
    },
    header: { marginBottom: 16, gap: 8 },
    progressBar: { height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: THEME.accent, borderRadius: 2 },
    stepLabel: { fontSize: 13, color: THEME.accent, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
    title: { fontSize: 34, fontWeight: '800', color: '#fff', lineHeight: 42 },
    titleAccent: { color: THEME.accent },
    subtitle: { fontSize: 15, color: THEME.muted, lineHeight: 22 },
    countRow: { marginBottom: 14 },
    countBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
        backgroundColor: 'rgba(255,107,107,0.12)', borderRadius: 20,
        paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,107,107,0.25)',
    },
    countText: { color: THEME.accent, fontSize: 13, fontWeight: '600' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, flex: 1 },
    slot: {
        width: '31%', aspectRatio: 0.75, borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)',
        borderStyle: 'dashed', overflow: 'hidden',
    },
    slotMain: { width: '48%', aspectRatio: 0.75 },
    placeholder: { flex: 1 },
    placeholderGrad: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 6 },
    placeholderText: { color: THEME.accent, fontSize: 12, fontWeight: '600' },
    image: { width: '100%', height: '100%', resizeMode: 'cover' },
    removeBtn: {
        position: 'absolute', top: 8, right: 8, width: 24, height: 24,
        borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center', alignItems: 'center',
    },
    mainBadge: {
        position: 'absolute', bottom: 8, left: 8,
        backgroundColor: THEME.accent, borderRadius: 8,
        paddingHorizontal: 8, paddingVertical: 3,
    },
    mainBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
    footer: { marginTop: 16 },
    btnWrapper: {
        borderRadius: 16, overflow: 'hidden',
        shadowColor: THEME.accent, shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
    },
    btnDisabled: { shadowOpacity: 0 },
    btn: { height: 56, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
    btnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
