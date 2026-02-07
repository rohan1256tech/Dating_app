import { useApp } from '@/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ChatListScreen() {
    const { conversations } = useApp();
    const router = useRouter();

    const handleChatPress = (id: string, partnerId: string) => {
        // We can pass conversation ID or partner ID. 
        // My ChatScreen logic handles both but prefers ID matching conversation ID or partner ID.
        // Let's pass the conversation ID.
        router.push(`/chat/${id}`);
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.chatItem}
            onPress={() => handleChatPress(item.id, item.partner.id)}
            activeOpacity={0.7}
        >
            <Image source={{ uri: item.partner.image }} style={styles.avatar} />
            <View style={styles.chatDetails}>
                <View style={styles.chatHeader}>
                    <Text style={styles.name}>{item.partner.name}</Text>
                    <Text style={styles.time}>
                        {new Date(item.lastMessageTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
                <View style={styles.messagePreviewContainer}>
                    <Text style={styles.messagePreview} numberOfLines={1}>
                        {item.lastMessage}
                    </Text>
                    {item.unreadCount > 0 && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadText}>{item.unreadCount}</Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Messages</Text>
            </View>

            {conversations.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
                    <Text style={styles.emptyText}>No messages yet.</Text>
                    <Text style={styles.emptySubtext}>Match with someone to start chatting!</Text>
                </View>
            ) : (
                <FlatList
                    data={conversations}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
    },
    listContent: {
        paddingBottom: 20,
    },
    chatItem: {
        flexDirection: 'row',
        padding: 16,
        alignItems: 'center',
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#f0f0f0',
    },
    chatDetails: {
        flex: 1,
        marginLeft: 16,
        justifyContent: 'center',
    },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
        alignItems: 'center',
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    time: {
        fontSize: 12,
        color: '#999',
    },
    messagePreviewContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    messagePreview: {
        fontSize: 14,
        color: '#666',
        flex: 1,
        marginRight: 10,
    },
    unreadBadge: {
        backgroundColor: '#FF6B6B',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
    },
    unreadText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    separator: {
        height: 1,
        backgroundColor: '#f0f0f0',
        marginLeft: 88, // Align with text start
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#666',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#999',
        marginTop: 8,
    },
});
