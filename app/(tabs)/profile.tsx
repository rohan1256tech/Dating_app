import { useApp } from '@/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const PHOTO_SIZE = (width - 48 - 24) / 3;

const THEME = {
    bg: ['#0f0c29', '#302b63', '#24243e'] as const,
    accent: '#FF6B6B',
    accentAlt: '#FF8E53',
    white: '#FFFFFF',
    muted: 'rgba(255,255,255,0.55)',
    card: 'rgba(255,255,255,0.07)',
    border: 'rgba(255,255,255,0.12)',
    danger: '#FF3B30',
    dangerBg: 'rgba(255,59,48,0.12)',
    dangerBorder: 'rgba(255,59,48,0.3)',
};

export default function ProfileScreen() {
    const { userProfile, logout, deleteAccount } = useApp();
    const router = useRouter();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleLogout = async () => {
        await logout();
        router.replace('/login');
    };

    const handleEditPhotos = () => {
        router.push('/profile-setup/photos');
    };

    const handleEditInterests = () => {
        router.push('/profile-setup/interests');
    };

    const handleDeleteAccount = async () => {
        setDeleting(true);
        try {
            await deleteAccount();
            setShowDeleteModal(false);
            router.replace('/login');
        } catch (err: any) {
            setDeleting(false);
            Alert.alert(
                'Error',
                err?.message || 'Failed to delete account. Please try again.',
                [{ text: 'OK' }]
            );
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />
            <LinearGradient colors={THEME.bg} style={StyleSheet.absoluteFill} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Profile</Text>
                    <TouchableOpacity style={styles.settingsBtn} onPress={() => { }}>
                        <Ionicons name="settings-outline" size={22} color={THEME.muted} />
                    </TouchableOpacity>
                </View>

                {/* Avatar + Name */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatarContainer}>
                        <LinearGradient colors={[THEME.accent, THEME.accentAlt]} style={styles.avatarRing}>
                            {userProfile.photos[0] ? (
                                <Image source={{ uri: userProfile.photos[0] }} style={styles.avatar} />
                            ) : (
                                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                                    <Ionicons name="person" size={44} color="rgba(255,255,255,0.4)" />
                                </View>
                            )}
                        </LinearGradient>
                        <TouchableOpacity style={styles.editBadge} onPress={handleEditPhotos}>
                            <Ionicons name="pencil" size={14} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.name}>
                        {userProfile.name || 'User'}
                        {userProfile.age ? <Text style={styles.nameAge}>, {userProfile.age}</Text> : ''}
                    </Text>
                    {userProfile.bio && <Text style={styles.bio}>{userProfile.bio}</Text>}

                    {/* Stats row */}
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNum}>{userProfile.photos?.length || 0}</Text>
                            <Text style={styles.statLabel}>Photos</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statNum}>{userProfile.interests?.length || 0}</Text>
                            <Text style={styles.statLabel}>Interests</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statNum}>{userProfile.age || '—'}</Text>
                            <Text style={styles.statLabel}>Age</Text>
                        </View>
                    </View>
                </View>

                {/* Photos */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Photos</Text>
                        <TouchableOpacity onPress={handleEditPhotos}>
                            <Text style={styles.editLink}>Edit</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.photosGrid}>
                        {(userProfile.photos?.length ? userProfile.photos : [null, null, null]).map((photo: string | null, index: number) => (
                            photo ? (
                                <Image key={index} source={{ uri: photo }} style={styles.photoItem} />
                            ) : (
                                <View key={index} style={[styles.photoItem, styles.photoPlaceholder]}>
                                    <Ionicons name="add" size={22} color="rgba(255,255,255,0.2)" />
                                </View>
                            )
                        ))}
                    </View>
                </View>

                {/* Interests */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Interests</Text>
                        <TouchableOpacity onPress={handleEditInterests}>
                            <Text style={styles.editLink}>Edit</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.chipsContainer}>
                        {userProfile.interests?.map((interest: string, index: number) => (
                            <View key={index} style={styles.chip}>
                                <Text style={styles.chipText}>{interest}</Text>
                            </View>
                        ))}
                        {(!userProfile.interests || userProfile.interests.length === 0) && (
                            <Text style={styles.emptyText}>No interests added yet.</Text>
                        )}
                    </View>
                </View>

                {/* Account Actions */}
                <View style={styles.actionsSection}>
                    {/* Logout */}
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
                        <Ionicons name="log-out-outline" size={20} color={THEME.accent} />
                        <Text style={styles.logoutText}>Log Out</Text>
                    </TouchableOpacity>

                    {/* Delete Account */}
                    <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => setShowDeleteModal(true)}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="trash-outline" size={20} color={THEME.danger} />
                        <Text style={styles.deleteText}>Delete Account</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.version}>Version 1.0.0</Text>

            </ScrollView>

            {/* ─── Delete Account Confirmation Modal ─── */}
            <Modal
                visible={showDeleteModal}
                transparent
                animationType="fade"
                onRequestClose={() => !deleting && setShowDeleteModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        {/* Warning icon */}
                        <View style={styles.modalIconWrap}>
                            <LinearGradient
                                colors={['rgba(255,59,48,0.2)', 'rgba(255,59,48,0.05)']}
                                style={styles.modalIconBg}
                            >
                                <Ionicons name="warning" size={36} color={THEME.danger} />
                            </LinearGradient>
                        </View>

                        <Text style={styles.modalTitle}>Delete Account?</Text>
                        <Text style={styles.modalBody}>
                            This will permanently delete your account, profile, matches, and all messages.{'\n\n'}
                            <Text style={{ fontWeight: '700', color: '#fff' }}>This action cannot be undone.</Text>
                        </Text>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={() => setShowDeleteModal(false)}
                                disabled={deleting}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.confirmDeleteBtn, deleting && { opacity: 0.7 }]}
                                onPress={handleDeleteAccount}
                                disabled={deleting}
                                activeOpacity={0.8}
                            >
                                {deleting ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <>
                                        <Ionicons name="trash" size={16} color="#fff" />
                                        <Text style={styles.confirmDeleteText}>Yes, Delete</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingBottom: 48 },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 24, paddingVertical: 16,
    },
    headerTitle: { fontSize: 28, fontWeight: '800', color: '#fff' },
    settingsBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.08)',
        justifyContent: 'center', alignItems: 'center',
    },
    profileHeader: { alignItems: 'center', marginBottom: 28, paddingHorizontal: 24 },
    avatarContainer: { position: 'relative', marginBottom: 16 },
    avatarRing: {
        width: 126, height: 126, borderRadius: 63,
        padding: 3, justifyContent: 'center', alignItems: 'center',
    },
    avatar: { width: 120, height: 120, borderRadius: 60 },
    avatarPlaceholder: { backgroundColor: 'rgba(255,255,255,0.08)', justifyContent: 'center', alignItems: 'center' },
    editBadge: {
        position: 'absolute', bottom: 2, right: 2,
        backgroundColor: THEME.accent, width: 34, height: 34, borderRadius: 17,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 3, borderColor: '#1a1729',
    },
    name: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 6 },
    nameAge: { color: THEME.muted, fontWeight: '400' },
    bio: { fontSize: 14, color: THEME.muted, textAlign: 'center', paddingHorizontal: 32, lineHeight: 20, marginBottom: 16 },
    statsRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 20,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
        paddingVertical: 14, paddingHorizontal: 24, gap: 0, marginTop: 8,
    },
    statItem: { flex: 1, alignItems: 'center' },
    statNum: { fontSize: 18, fontWeight: '800', color: '#fff' },
    statLabel: { fontSize: 12, color: THEME.muted, marginTop: 2 },
    statDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.12)' },
    section: { paddingHorizontal: 24, marginBottom: 28 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    sectionTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
    editLink: { color: THEME.accent, fontWeight: '600', fontSize: 14 },
    photosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    photoItem: { width: PHOTO_SIZE, height: PHOTO_SIZE, borderRadius: 14 },
    photoPlaceholder: {
        backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center',
        borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)', borderStyle: 'dashed',
    },
    chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    chip: {
        paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
        backgroundColor: 'rgba(255,107,107,0.12)',
        borderWidth: 1, borderColor: 'rgba(255,107,107,0.3)',
    },
    chipText: { color: THEME.accent, fontSize: 14, fontWeight: '600' },
    emptyText: { color: THEME.muted, fontStyle: 'italic', fontSize: 14 },

    // Account actions
    actionsSection: { paddingHorizontal: 24, gap: 12, marginBottom: 16 },
    logoutBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: 'rgba(255,107,107,0.1)', paddingVertical: 16, borderRadius: 16,
        borderWidth: 1, borderColor: 'rgba(255,107,107,0.25)',
    },
    logoutText: { color: THEME.accent, fontWeight: '700', fontSize: 16 },
    deleteBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        backgroundColor: THEME.dangerBg, paddingVertical: 16, borderRadius: 16,
        borderWidth: 1, borderColor: THEME.dangerBorder,
    },
    deleteText: { color: THEME.danger, fontWeight: '700', fontSize: 16 },

    version: { textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 12 },

    // Modal
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.75)',
        justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24,
    },
    modalCard: {
        backgroundColor: '#1e1b38', borderRadius: 24, padding: 28, width: '100%',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
        shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20, elevation: 20,
    },
    modalIconWrap: { alignItems: 'center', marginBottom: 20 },
    modalIconBg: {
        width: 80, height: 80, borderRadius: 40,
        justifyContent: 'center', alignItems: 'center',
    },
    modalTitle: { fontSize: 22, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 12 },
    modalBody: { fontSize: 15, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 22, marginBottom: 28 },
    modalActions: { flexDirection: 'row', gap: 12 },
    cancelBtn: {
        flex: 1, paddingVertical: 15, borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center', justifyContent: 'center',
    },
    cancelText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    confirmDeleteBtn: {
        flex: 1, paddingVertical: 15, borderRadius: 14,
        backgroundColor: THEME.danger,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    confirmDeleteText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
