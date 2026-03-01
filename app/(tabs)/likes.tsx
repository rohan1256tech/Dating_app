import { useApp } from '@/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PremiumModal from '../../components/PremiumModal';

interface LikeItem {
    userId: string;
    name: string;
    age?: number;
    photo: string | null;
    blurred: boolean;
    likedAt: string;
    action: string;
}

export default function LikesScreen() {
    useApp(); // ensure context is mounted
    const [likes, setLikes] = useState<LikeItem[]>([]);
    const [isPremium, setIsPremium] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    useFocusEffect(
        useCallback(() => {
            fetchLikes();
        }, [])
    );

    const fetchLikes = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('accessToken');
            if (!token) return;
            const { api } = await import('../../services/api');
            const res = await api.getLikesReceived(token);
            if (res.data) {
                setLikes(res.data.likes ?? []);
                setIsPremium(res.data.isPremium ?? false);
            }
        } catch (e) {
            // silent
        } finally {
            setLoading(false);
        }
    };

    const renderLike = ({ item }: { item: LikeItem }) => {
        if (item.blurred) {
            return (
                <TouchableOpacity style={styles.card} onPress={() => setShowModal(true)} activeOpacity={0.85}>
                    {/* Blurred placeholder */}
                    <View style={styles.blurredPhoto}>
                        <LinearGradient colors={['rgba(255,107,107,0.2)', 'rgba(48,43,99,0.8)']} style={StyleSheet.absoluteFill} />
                        <Ionicons name="heart" size={32} color="rgba(255,107,107,0.7)" />
                    </View>
                    <View style={styles.cardInfo}>
                        <Text style={styles.blurredName}>{item.name}</Text>
                        {item.age && <Text style={styles.cardAge}>{item.age} yrs</Text>}
                    </View>
                    {/* Lock badge */}
                    <View style={styles.lockBadge}>
                        <Ionicons name="lock-closed" size={12} color="#fff" />
                    </View>
                </TouchableOpacity>
            );
        }

        return (
            <View style={styles.card}>
                <Image
                    source={{ uri: item.photo ?? '' }}
                    style={styles.photo}
                    defaultSource={require('../../assets/images/icon.png')}
                />
                <View style={styles.cardInfo}>
                    <Text style={styles.cardName}>{item.name}</Text>
                    {item.age && <Text style={styles.cardAge}>{item.age} yrs</Text>}
                </View>
                {item.action === 'SUPERLIKE' && (
                    <View style={styles.superBadge}>
                        <Ionicons name="star" size={12} color="#fff" />
                    </View>
                )}
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
                    <Text style={styles.title}>Liked You</Text>
                    {!isPremium && (
                        <Text style={styles.headerSub}>Upgrade to see who liked you</Text>
                    )}
                </View>
                {!isPremium && (
                    <TouchableOpacity style={styles.upgradeBtn} onPress={() => setShowModal(true)}>
                        <LinearGradient colors={['#FF6B6B', '#FF8E53']} style={styles.upgradeGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                            <Ionicons name="diamond" size={14} color="#fff" />
                            <Text style={styles.upgradeText}>Upgrade</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                )}
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#FF6B6B" />
                </View>
            ) : likes.length === 0 ? (
                <View style={styles.center}>
                    <LinearGradient colors={['rgba(255,107,107,0.15)', 'rgba(255,142,83,0.08)']} style={styles.emptyIcon}>
                        <Ionicons name="heart-outline" size={48} color="#FF6B6B" />
                    </LinearGradient>
                    <Text style={styles.emptyTitle}>No likes yet</Text>
                    <Text style={styles.emptyText}>Keep swiping — someone will notice you!</Text>
                </View>
            ) : (
                <>
                    {/* Count bar */}
                    <View style={styles.countBar}>
                        <LinearGradient colors={['rgba(255,107,107,0.15)', 'rgba(255,142,83,0.08)']} style={styles.countBadge}>
                            <Ionicons name="heart" size={14} color="#FF6B6B" />
                            <Text style={styles.countText}>{likes.length} {likes.length === 1 ? 'person' : 'people'} liked you</Text>
                        </LinearGradient>
                    </View>

                    <FlatList
                        data={likes}
                        keyExtractor={(item, i) => item.userId + i}
                        numColumns={2}
                        contentContainerStyle={styles.grid}
                        columnWrapperStyle={styles.row}
                        renderItem={renderLike}
                        showsVerticalScrollIndicator={false}
                    />
                </>
            )}

            <PremiumModal
                visible={showModal}
                reason="likes"
                onClose={() => setShowModal(false)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 16,
    },
    title: { fontSize: 26, fontWeight: '800', color: '#fff' },
    headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
    upgradeBtn: { borderRadius: 20, overflow: 'hidden' },
    upgradeGrad: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8 },
    upgradeText: { color: '#fff', fontWeight: '700', fontSize: 13 },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
    emptyIcon: { width: 96, height: 96, borderRadius: 48, justifyContent: 'center', alignItems: 'center' },
    emptyTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
    emptyText: { fontSize: 14, color: 'rgba(255,255,255,0.45)', textAlign: 'center', paddingHorizontal: 40 },

    countBar: { paddingHorizontal: 20, marginBottom: 12 },
    countBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
        alignSelf: 'flex-start',
        borderWidth: 1, borderColor: 'rgba(255,107,107,0.3)',
    },
    countText: { color: '#FF6B6B', fontWeight: '700', fontSize: 13 },

    grid: { paddingHorizontal: 12, paddingBottom: 20 },
    row: { gap: 12, marginBottom: 12 },

    card: {
        flex: 1, borderRadius: 18, overflow: 'hidden',
        backgroundColor: 'rgba(255,255,255,0.07)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
        aspectRatio: 0.8,
        position: 'relative',
    },
    photo: { width: '100%', height: '80%', resizeMode: 'cover' },
    blurredPhoto: {
        width: '100%', height: '80%',
        justifyContent: 'center', alignItems: 'center',
        backgroundColor: 'rgba(48,43,99,0.7)',
    },
    cardInfo: { padding: 8 },
    cardName: { fontSize: 13, fontWeight: '700', color: '#fff' },
    blurredName: { fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.6)' },
    cardAge: { fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 },
    lockBadge: {
        position: 'absolute', top: 8, right: 8,
        backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 12,
        padding: 5,
    },
    superBadge: {
        position: 'absolute', top: 8, right: 8,
        backgroundColor: '#FF6B6B', borderRadius: 12, padding: 5,
    },
});
