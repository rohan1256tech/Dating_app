import { useApp } from '@/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const THEME = {
    bg: ['#0f0c29', '#302b63', '#24243e'] as const,
    accent: '#FF6B6B',
    accentAlt: '#FF8E53',
    white: '#FFFFFF',
    muted: 'rgba(255,255,255,0.55)',
};

export default function ChatListScreen() {
    const { conversations } = useApp();
    const router = useRouter();

    const handleChatPress = (id: string) => {
        router.push(`/chat/${id}`);
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.chatItem}
            onPress={() => handleChatPress(item.id)}
            activeOpacity={0.7}
        >
            <View style={styles.avatarWrapper}>
                <Image source={{ uri: item.partner.image }} style={styles.avatar} />
                {item.unreadCount > 0 && <View style={styles.onlineDot} />}
            </View>
            <View style={styles.chatDetails}>
                <View style={styles.chatHeader}>
                    <Text style={styles.name}>{item.partner.name}</Text>
                    <Text style={styles.time}>
                        {item.lastMessageTimestamp
                            ? new Date(item.lastMessageTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : ''}
                    </Text>
                </View>
                <View style={styles.previewRow}>
                    <Text style={[styles.messagePreview, item.unreadCount > 0 && styles.messagePreviewUnread]} numberOfLines={1}>
                        {item.lastMessage}
                    </Text>
                    {item.unreadCount > 0 && (
                        <LinearGradient colors={[THEME.accent, THEME.accentAlt]} style={styles.unreadBadge} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                            <Text style={styles.unreadText}>{item.unreadCount}</Text>
                        </LinearGradient>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />
            <LinearGradient colors={THEME.bg} style={StyleSheet.absoluteFill} />

            <View style={styles.header}>
                <Text style={styles.title}>Messages</Text>
                {conversations.length > 0 && (
                    <View style={styles.countBadge}>
                        <Text style={styles.countText}>{conversations.length}</Text>
                    </View>
                )}
            </View>

            {conversations.length === 0 ? (
                <View style={styles.emptyState}>
                    <LinearGradient colors={['rgba(255,107,107,0.15)', 'rgba(255,142,83,0.08)']} style={styles.emptyIcon}>
                        <Ionicons name="chatbubbles-outline" size={52} color={THEME.accent} />
                    </LinearGradient>
                    <Text style={styles.emptyText}>No messages yet</Text>
                    <Text style={styles.emptySubtext}>Match with someone to start chatting!</Text>
                </View>
            ) : (
                <FlatList
                    data={conversations}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
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
    countBadge: {
        backgroundColor: 'rgba(255,107,107,0.2)', borderRadius: 12,
        paddingHorizontal: 10, paddingVertical: 3,
        borderWidth: 1, borderColor: 'rgba(255,107,107,0.3)',
    },
    countText: { color: THEME.accent, fontWeight: '700', fontSize: 13 },
    listContent: { paddingVertical: 8 },
    chatItem: { flexDirection: 'row', padding: 16, alignItems: 'center' },
    avatarWrapper: { position: 'relative' },
    avatar: {
        width: 58, height: 58, borderRadius: 29,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 2, borderColor: 'rgba(255,255,255,0.12)',
    },
    onlineDot: {
        position: 'absolute', bottom: 2, right: 2,
        width: 12, height: 12, borderRadius: 6,
        backgroundColor: '#4CAF50', borderWidth: 2, borderColor: '#1a1729',
    },
    chatDetails: { flex: 1, marginLeft: 14, justifyContent: 'center' },
    chatHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5, alignItems: 'center' },
    name: { fontSize: 16, fontWeight: '700', color: '#fff' },
    time: { fontSize: 12, color: THEME.muted },
    previewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    messagePreview: { fontSize: 14, color: THEME.muted, flex: 1, marginRight: 10 },
    messagePreviewUnread: { color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
    unreadBadge: {
        borderRadius: 10, minWidth: 20, height: 20,
        justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6,
    },
    unreadText: { color: '#fff', fontSize: 11, fontWeight: '700' },
    separator: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginLeft: 88 },
    emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
    emptyIcon: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    emptyText: { fontSize: 20, fontWeight: '700', color: '#fff' },
    emptySubtext: { fontSize: 14, color: THEME.muted },
});
