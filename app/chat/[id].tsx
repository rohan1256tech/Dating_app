import { useApp } from '@/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useRef, useState } from 'react';
import {
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const THEME = {
    bg: ['#0f0c29', '#302b63', '#24243e'] as const,
    accent: '#FF6B6B',
    accentAlt: '#FF8E53',
    muted: 'rgba(255,255,255,0.45)',
    card: 'rgba(255,255,255,0.07)',
    border: 'rgba(255,255,255,0.10)',
};

export default function ChatScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { conversations, matches, sendMessage, fetchMessages } = useApp();
    const router = useRouter();

    let conversation = conversations.find(c => c.id === id);
    if (!conversation) conversation = conversations.find(c => c.partner.id === id);

    const partner = conversation?.partner || matches.find(m => m.id === id);

    const [messageText, setMessageText] = useState('');
    const flatListRef = useRef<FlatList>(null);

    useFocusEffect(
        useCallback(() => {
            if (conversation?.id) fetchMessages(conversation.id);
        }, [conversation?.id, fetchMessages])
    );

    const handleSend = async () => {
        if (!messageText.trim() || !conversation) return;
        await sendMessage(conversation.id, messageText.trim());
        setMessageText('');
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    };

    // ── Error state ──────────────────────────────────────────────────────────
    if (!partner) {
        return (
            <SafeAreaView style={styles.container}>
                <LinearGradient colors={THEME.bg} style={StyleSheet.absoluteFill} />
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Ionicons name="chevron-back" size={28} color={THEME.accent} />
                    </TouchableOpacity>
                    <Text style={styles.headerName}>Error</Text>
                </View>
                <View style={styles.center}>
                    <Ionicons name="alert-circle-outline" size={48} color={THEME.accent} />
                    <Text style={styles.errorMsg}>User not found</Text>
                </View>
            </SafeAreaView>
        );
    }

    // ── Main chat ────────────────────────────────────────────────────────────
    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar style="light" />
            <LinearGradient colors={THEME.bg} style={StyleSheet.absoluteFill} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color={THEME.accent} />
                </TouchableOpacity>

                <View style={styles.headerContent}>
                    <View style={styles.avatarWrapper}>
                        <Image source={{ uri: partner.image }} style={styles.avatar} />
                        <View style={styles.onlineDot} />
                    </View>
                    <View>
                        <Text style={styles.headerName}>{partner.name}</Text>
                        <Text style={styles.headerSub}>Online now</Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.optionBtn}>
                    <Ionicons name="ellipsis-vertical" size={22} color={THEME.muted} />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* Messages */}
                {conversation?.isLoading && !conversation.hasLoadedMessages ? (
                    <View style={styles.center}>
                        <Text style={styles.loadingText}>Loading messages…</Text>
                    </View>
                ) : conversation?.error ? (
                    <View style={styles.center}>
                        <Text style={styles.errorMsg}>{conversation.error}</Text>
                        <TouchableOpacity
                            style={styles.retryBtn}
                            onPress={() => conversation?.id && fetchMessages(conversation.id)}
                        >
                            <LinearGradient colors={[THEME.accent, THEME.accentAlt]} style={styles.retryGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                <Text style={styles.retryText}>Retry</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={conversation ? conversation.messages : []}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.messagesList}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => {
                            const isMe = item.senderId === 'me';
                            const isTemp = item.id.startsWith('temp-');
                            return (
                                <View style={[
                                    styles.bubbleRow,
                                    isMe ? styles.bubbleRowMe : styles.bubbleRowThem,
                                ]}>
                                    {!isMe && (
                                        <Image source={{ uri: partner.image }} style={styles.bubbleAvatar} />
                                    )}
                                    <View style={[
                                        styles.bubble,
                                        isMe ? styles.bubbleMe : styles.bubbleThem,
                                        isTemp && styles.bubbleSending,
                                    ]}>
                                        {isMe && (
                                            <LinearGradient
                                                colors={[THEME.accent, THEME.accentAlt]}
                                                style={StyleSheet.absoluteFill}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                            />
                                        )}
                                        <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextThem]}>
                                            {item.text}
                                        </Text>
                                        <Text style={[styles.timestamp, isMe ? styles.tsMe : styles.tsThem]}>
                                            {isTemp ? 'Sending…' : new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    </View>
                                </View>
                            );
                        }}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <LinearGradient colors={['rgba(255,107,107,0.12)', 'rgba(255,142,83,0.06)']} style={styles.emptyIcon}>
                                    <Ionicons name="chatbubble-ellipses-outline" size={36} color={THEME.accent} />
                                </LinearGradient>
                                <Text style={styles.emptyTitle}>Say hello! 👋</Text>
                                <Text style={styles.emptyText}>Start the conversation with {partner.name}</Text>
                            </View>
                        }
                    />
                )}

                {/* Input bar */}
                <View style={styles.inputBar}>
                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.input}
                            placeholder="Type a message…"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            value={messageText}
                            onChangeText={setMessageText}
                            multiline
                            maxLength={1000}
                        />
                    </View>
                    <TouchableOpacity
                        style={[styles.sendBtn, !messageText.trim() && styles.sendBtnDisabled]}
                        onPress={handleSend}
                        disabled={!messageText.trim()}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={messageText.trim() ? [THEME.accent, THEME.accentAlt] : ['rgba(255,107,107,0.25)', 'rgba(255,142,83,0.15)']}
                            style={styles.sendBtnGrad}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Ionicons name="send" size={18} color={messageText.trim() ? '#fff' : 'rgba(255,255,255,0.3)'} />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    // Header
    header: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 12, paddingVertical: 10,
        borderBottomWidth: 1, borderBottomColor: THEME.border,
        height: 64,
    },
    backBtn: { padding: 4, marginRight: 4 },
    headerContent: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
    avatarWrapper: { position: 'relative' },
    avatar: {
        width: 40, height: 40, borderRadius: 20,
        borderWidth: 2, borderColor: THEME.accent,
    },
    onlineDot: {
        position: 'absolute', bottom: 0, right: 0,
        width: 11, height: 11, borderRadius: 6,
        backgroundColor: '#4CAF50', borderWidth: 2, borderColor: '#1a1729',
    },
    headerName: { fontSize: 17, fontWeight: '700', color: '#fff' },
    headerSub: { fontSize: 12, color: '#4CAF50', fontWeight: '500' },
    optionBtn: { padding: 8 },

    // Layout
    keyboardView: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },

    // Messages list
    messagesList: { paddingHorizontal: 14, paddingTop: 16, paddingBottom: 12 },

    // Bubble row
    bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 10, gap: 8 },
    bubbleRowMe: { justifyContent: 'flex-end' },
    bubbleRowThem: { justifyContent: 'flex-start' },
    bubbleAvatar: { width: 28, height: 28, borderRadius: 14, marginBottom: 2 },

    // Bubble
    bubble: {
        maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 10,
        borderRadius: 20, overflow: 'hidden', position: 'relative',
    },
    bubbleMe: { borderBottomRightRadius: 4 },
    bubbleThem: {
        backgroundColor: 'rgba(255,255,255,0.09)',
        borderBottomLeftRadius: 4,
        borderWidth: 1, borderColor: THEME.border,
    },
    bubbleSending: { opacity: 0.55 },
    bubbleText: { fontSize: 15, lineHeight: 22 },
    bubbleTextMe: { color: '#fff', fontWeight: '500' },
    bubbleTextThem: { color: 'rgba(255,255,255,0.9)' },
    timestamp: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
    tsMe: { color: 'rgba(255,255,255,0.6)' },
    tsThem: { color: 'rgba(255,255,255,0.35)' },

    // Empty state
    emptyContainer: { paddingTop: 60, alignItems: 'center', gap: 10 },
    emptyIcon: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
    emptyTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
    emptyText: { fontSize: 14, color: THEME.muted, textAlign: 'center' },

    // Input bar
    inputBar: {
        flexDirection: 'row', alignItems: 'flex-end', gap: 10,
        paddingHorizontal: 14, paddingVertical: 10,
        borderTopWidth: 1, borderTopColor: THEME.border,
        backgroundColor: 'rgba(15,12,41,0.95)',
    },
    inputWrapper: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 24, borderWidth: 1, borderColor: THEME.border,
        paddingHorizontal: 16, paddingVertical: 10,
        minHeight: 44, justifyContent: 'center',
    },
    input: {
        color: '#fff', fontSize: 15, maxHeight: 100,
        padding: 0, margin: 0,
    },
    sendBtn: { borderRadius: 22, overflow: 'hidden' },
    sendBtnDisabled: {},
    sendBtnGrad: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },

    // States
    loadingText: { color: THEME.muted, fontSize: 15 },
    errorMsg: { color: THEME.accent, fontSize: 15, textAlign: 'center' },
    retryBtn: { borderRadius: 20, overflow: 'hidden' },
    retryGrad: { paddingHorizontal: 24, paddingVertical: 10 },
    retryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
