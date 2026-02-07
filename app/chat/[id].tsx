import { useApp } from '@/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { FlatList, Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChatScreen() {
    const { id } = useLocalSearchParams<{ id: string }>(); // This is likely the PARTNER ID based on my MatchesScreen logic
    const { conversations, matches, sendMessage, swipeRight } = useApp(); // "swipeRight" logic creates conversation if not exists
    const router = useRouter();

    // We need to find the conversation. 
    // If we came from Matches screen, we passed the match ID (partner ID).
    // If we came from Chat List, we likely passed the conversation ID or partner ID.
    // Let's assume ID is PARTNER ID for consistency with MatchesScreen.
    // But wait, Chat List usually has Conversation ID.
    // Let's handle both or stick to one. 
    // Let's try to find conversation by ID first, then by partner ID.

    let conversation = conversations.find(c => c.id === id);
    if (!conversation) {
        conversation = conversations.find(c => c.partner.id === id);
    }

    // If still no conversation, maybe it's a new match we haven't chatted with yet?
    // In my context logic, I created a conversation immediately upon match.
    // So if it's a valid match, it should be there.
    // If not found, maybe invalid ID.

    const partner = conversation?.partner || matches.find(m => m.id === id);

    const [messageText, setMessageText] = useState('');
    const flatListRef = useRef<FlatList>(null);

    const handleSend = () => {
        if (!messageText.trim() || !conversation) return;

        sendMessage(conversation.id, messageText.trim());
        setMessageText('');
    };

    if (!partner) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Error</Text>
                </View>
                <View style={styles.center}>
                    <Text>User not found</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color="#FF6B6B" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Image source={{ uri: partner.image }} style={styles.avatar} />
                    <Text style={styles.headerTitle}>{partner.name}</Text>
                </View>
                <TouchableOpacity style={styles.optionButton}>
                    <Ionicons name="ellipsis-vertical" size={24} color="#333" />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                {/* Messages List */}
                <FlatList
                    ref={flatListRef}
                    data={conversation ? conversation.messages : []}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.messagesList}
                    inverted={false} // Usually chat is inverted, but my data is chronological. Let's keep duplicate or scroll to end.
                    // For simplicity, let's render normal and scroll to end.
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    renderItem={({ item }) => {
                        const isMe = item.senderId === 'me';
                        return (
                            <View style={[
                                styles.messageBubble,
                                isMe ? styles.myMessage : styles.theirMessage
                            ]}>
                                <Text style={[
                                    styles.messageText,
                                    isMe ? styles.myMessageText : styles.theirMessageText
                                ]}>{item.text}</Text>
                                <Text style={[
                                    styles.timestamp,
                                    isMe ? styles.myTimestamp : styles.theirTimestamp
                                ]}>
                                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </View>
                        );
                    }}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Start the conversation with {partner.name}!</Text>
                        </View>
                    }
                />

                {/* Input Area */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Type a message..."
                        value={messageText}
                        onChangeText={setMessageText}
                        multiline
                    />
                    <TouchableOpacity
                        style={[styles.sendButton, !messageText.trim() && styles.sendButtonDisabled]}
                        onPress={handleSend}
                        disabled={!messageText.trim()}
                    >
                        <Ionicons name="send" size={20} color="#fff" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        height: 60,
    },
    backButton: {
        padding: 4,
        marginRight: 8,
    },
    headerContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 10,
        backgroundColor: '#eee',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
    optionButton: {
        padding: 8,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    keyboardView: {
        flex: 1,
    },
    messagesList: {
        paddingHorizontal: 16,
        paddingBottom: 20,
        paddingTop: 20,
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#999',
        fontSize: 16,
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 20,
        marginBottom: 8,
    },
    myMessage: {
        alignSelf: 'flex-end',
        backgroundColor: '#FF6B6B',
        borderBottomRightRadius: 4,
    },
    theirMessage: {
        alignSelf: 'flex-start',
        backgroundColor: '#F0F0F0',
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 16,
        lineHeight: 22,
    },
    myMessageText: {
        color: '#fff',
    },
    theirMessageText: {
        color: '#333',
    },
    timestamp: {
        fontSize: 10,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    myTimestamp: {
        color: 'rgba(255,255,255,0.7)',
    },
    theirTimestamp: {
        color: '#999',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        backgroundColor: '#fff',
    },
    input: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 16,
        maxHeight: 100,
        marginRight: 10,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FF6B6B',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#FFCDD2',
    },
});
