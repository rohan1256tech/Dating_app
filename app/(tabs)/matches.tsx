import { useApp } from '@/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const THEME = {
    bg: ['#0f0c29', '#302b63', '#24243e'] as const,
    accent: '#FF6B6B',
    accentAlt: '#FF8E53',
    white: '#FFFFFF',
    muted: 'rgba(255,255,255,0.55)',
    card: 'rgba(255,255,255,0.07)',
    border: 'rgba(255,255,255,0.12)',
};

export default function MatchesScreen() {
    const { matches, conversations, fetchMatches } = useApp();
    const router = useRouter();

    useFocusEffect(
        useCallback(() => {
            fetchMatches();
        }, [])
    );

    const handleChatPress = (matchId: string) => {
        const conversation = conversations.find(c => c.partner.id === matchId);
        if (conversation) {
            router.push(`/chat/${conversation.id}`);
        } else {
            router.push(`/chat/${matchId}`);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity style={styles.matchItem} onPress={() => handleChatPress(item.id)} activeOpacity={0.8}>
            <View style={styles.matchImageWrapper}>
                <Image source={{ uri: item.image }} style={styles.matchImage} />
                <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.65)']}
                    style={styles.matchGrad}
                />
                <View style={styles.matchChatBtn}>
                    <Ionicons name="chatbubble" size={14} color="#fff" />
                </View>
            </View>
            <Text style={styles.matchName}>{item.name}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />
            <LinearGradient colors={THEME.bg} style={StyleSheet.absoluteFill} />

            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Matches</Text>
                {matches.length > 0 && (
                    <LinearGradient colors={[THEME.accent, THEME.accentAlt]} style={styles.badge} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                        <Text style={styles.badgeText}>{matches.length}</Text>
                    </LinearGradient>
                )}
            </View>

            {matches.length === 0 ? (
                <View style={styles.emptyState}>
                    <LinearGradient colors={['rgba(255,107,107,0.15)', 'rgba(255,142,83,0.08)']} style={styles.emptyIcon}>
                        <Ionicons name="heart-outline" size={52} color={THEME.accent} />
                    </LinearGradient>
                    <Text style={styles.emptyText}>No matches yet</Text>
                    <Text style={styles.emptySubtext}>Keep swiping to find your pair!</Text>
                </View>
            ) : (
                <FlatList
                    data={matches}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    numColumns={2}
                    columnWrapperStyle={styles.columnWrapper}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingHorizontal: 24, paddingVertical: 16,
        flexDirection: 'row', alignItems: 'center', gap: 10,
        borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
    },
    title: { fontSize: 28, fontWeight: '800', color: '#fff' },
    badge: {
        borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3,
    },
    badgeText: { color: '#fff', fontWeight: '700', fontSize: 13 },
    listContent: { padding: 16 },
    columnWrapper: { justifyContent: 'space-between', marginBottom: 14 },
    matchItem: { width: '48%' },
    matchImageWrapper: {
        borderRadius: 16, overflow: 'hidden', aspectRatio: 0.8,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
        marginBottom: 6,
    },
    matchImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    matchGrad: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%' },
    matchChatBtn: {
        position: 'absolute', bottom: 10, right: 10,
        width: 30, height: 30, borderRadius: 15,
        backgroundColor: THEME.accent,
        justifyContent: 'center', alignItems: 'center',
    },
    matchName: { fontSize: 15, fontWeight: '700', color: '#fff', paddingHorizontal: 2 },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
    emptyIcon: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    emptyText: { fontSize: 20, fontWeight: '700', color: '#fff' },
    emptySubtext: { fontSize: 14, color: THEME.muted },
});
