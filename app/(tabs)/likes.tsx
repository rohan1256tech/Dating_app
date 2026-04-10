import api from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

interface LikedUser {
    userId: string;
    name: string;
    age: number;
    photo?: string;
    photos?: string[];
    isBlurred?: boolean;
}

export default function LikesScreen() {
    const [likes, setLikes] = useState<LikedUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useFocusEffect(
        useCallback(() => {
            loadLikes();
        }, [])
    );

    const loadLikes = async () => {
        setLoading(true);
        setError('');
        try {
            const token = await AsyncStorage.getItem('accessToken');
            if (!token) { setLoading(false); return; }

            const response = await api.getLikesReceived(token);
            if (response.data) {
                // Backend returns array directly or wrapped in { likes: [] }
                const data = Array.isArray(response.data)
                    ? response.data
                    : (response.data as any).likes || [];
                setLikes(data);
            } else if (response.error) {
                setError(response.error);
            }
        } catch (e) {
            setError('Could not load likes right now.');
        } finally {
            setLoading(false);
        }
    };

    // ── Loading ───────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={StyleSheet.absoluteFill} />
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Likes</Text>
                </View>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#FF6B6B" />
                    <Text style={styles.loadingText}>Loading your admirers…</Text>
                </View>
            </SafeAreaView>
        );
    }

    // ── Error ─────────────────────────────────────────────────────────────────
    if (error) {
        return (
            <SafeAreaView style={styles.container}>
                <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={StyleSheet.absoluteFill} />
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Likes</Text>
                </View>
                <View style={styles.center}>
                    <LinearGradient colors={['rgba(255,107,107,0.15)', 'rgba(255,142,83,0.08)']} style={styles.emptyIcon}>
                        <Ionicons name="alert-circle-outline" size={44} color="#FF6B6B" />
                    </LinearGradient>
                    <Text style={styles.emptyTitle}>Something went wrong</Text>
                    <Text style={styles.emptyText}>{error}</Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={loadLikes} activeOpacity={0.8}>
                        <LinearGradient colors={['#FF6B6B', '#FF8E53']} style={styles.retryGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                            <Ionicons name="refresh" size={16} color="#fff" />
                            <Text style={styles.retryText}>Retry</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // ── Empty ─────────────────────────────────────────────────────────────────
    if (likes.length === 0) {
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar style="light" />
                <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={StyleSheet.absoluteFill} />
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Likes</Text>
                </View>
                <View style={styles.center}>
                    <LinearGradient colors={['rgba(255,107,107,0.15)', 'rgba(255,142,83,0.08)']} style={styles.emptyIcon}>
                        <Ionicons name="heart-outline" size={44} color="#FF6B6B" />
                    </LinearGradient>
                    <Text style={styles.emptyTitle}>No likes yet</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.emptyText}>Keep swiping — someone will like you back soon!</Text>
                        <Ionicons name="sparkles" size={16} color="#FFD700" />
                    </View>
                    <TouchableOpacity style={styles.retryBtn} onPress={loadLikes} activeOpacity={0.8}>
                        <LinearGradient colors={['#FF6B6B', '#FF8E53']} style={styles.retryGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                            <Ionicons name="refresh" size={16} color="#fff" />
                            <Text style={styles.retryText}>Refresh</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // ── List ─────────────────────────────────────────────────────────────────
    const renderItem = ({ item }: { item: LikedUser }) => {
        const photo = item.photo || item.photos?.[0];
        return (
            <View style={styles.card}>
                {photo ? (
                    <Image
                        source={{ uri: photo }}
                        style={[styles.cardImage, item.isBlurred && styles.blurred]}
                        blurRadius={item.isBlurred ? 20 : 0}
                    />
                ) : (
                    <LinearGradient colors={['#302b63', '#24243e']} style={styles.cardImage}>
                        <Ionicons name="person" size={48} color="rgba(255,255,255,0.3)" />
                    </LinearGradient>
                )}
                <LinearGradient
                    colors={['transparent', 'rgba(15,12,41,0.92)']}
                    style={styles.cardOverlay}
                >
                    {item.isBlurred ? (
                        <View style={styles.lockRow}>
                            <Ionicons name="lock-closed" size={14} color="#FFD700" />
                            <Text style={styles.lockText}>Premium</Text>
                        </View>
                    ) : (
                        <>
                            <Text style={styles.cardName}>{item.name}</Text>
                            {item.age ? <Text style={styles.cardAge}>{item.age} yrs</Text> : null}
                        </>
                    )}
                </LinearGradient>
                {/* Heart badge */}
                <View style={styles.heartBadge}>
                    <Ionicons name="heart" size={14} color="#fff" />
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />
            <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={StyleSheet.absoluteFill} />

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>Likes</Text>
                    <Text style={styles.headerSub}>{likes.length} {likes.length === 1 ? 'person' : 'people'} liked you</Text>
                </View>
                <TouchableOpacity onPress={loadLikes} style={styles.refreshIconBtn} activeOpacity={0.7}>
                    <Ionicons name="refresh" size={20} color="#FF6B6B" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={likes}
                keyExtractor={(item, i) => item.userId || String(i)}
                renderItem={renderItem}
                numColumns={2}
                contentContainerStyle={styles.grid}
                columnWrapperStyle={styles.row}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14, paddingHorizontal: 32 },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.08)',
    },
    headerTitle: { fontSize: 26, fontWeight: '800', color: '#FF6B6B' },
    headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
    refreshIconBtn: {
        width: 40, height: 40, borderRadius: 20,
        backgroundColor: 'rgba(255,107,107,0.12)',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: 'rgba(255,107,107,0.25)',
    },

    loadingText: { color: 'rgba(255,255,255,0.5)', fontSize: 15, marginTop: 8 },
    emptyIcon: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
    emptyTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
    emptyText: { fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 22 },
    retryBtn: { borderRadius: 24, overflow: 'hidden', marginTop: 4 },
    retryGrad: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 12 },
    retryText: { color: '#fff', fontWeight: '700', fontSize: 14 },

    grid: { padding: 16, paddingBottom: 32 },
    row: { gap: 16 },

    card: {
        width: CARD_WIDTH,
        height: CARD_WIDTH * 1.35,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#1a1729',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    cardImage: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    blurred: { opacity: 0.4 },
    cardOverlay: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        padding: 12,
        paddingTop: 30,
    },
    cardName: { color: '#fff', fontWeight: '700', fontSize: 15 },
    cardAge: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 2 },
    lockRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    lockText: { color: '#FFD700', fontWeight: '700', fontSize: 13 },
    heartBadge: {
        position: 'absolute', top: 10, right: 10,
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: '#FF6B6B',
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#FF6B6B', shadowOpacity: 0.5, shadowRadius: 6, elevation: 4,
    },
});
