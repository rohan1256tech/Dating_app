import { useApp } from '@/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MatchesScreen() {
    const { matches, conversations } = useApp();
    const router = useRouter();

    const handleChatPress = (matchId: string) => {
        // Find existing conversation with this partner
        const conversation = conversations.find(c => c.partner.id === matchId);

        if (conversation) {
            router.push(`/chat/${conversation.id}`);
        } else {
            // Fallback: pass partner ID if no conversation found (though swipeRight creates one)
            router.push(`/chat/${matchId}`);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity style={styles.matchItem} onPress={() => handleChatPress(item.id)}>
            <Image source={{ uri: item.image }} style={styles.matchImage} />
            <Text style={styles.matchName}>{item.name}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>New Matches</Text>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{matches.length}</Text>
                </View>
            </View>

            {matches.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="heart-outline" size={64} color="#ccc" />
                    <Text style={styles.emptyText}>No matches yet.</Text>
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
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginRight: 8,
    },
    badge: {
        backgroundColor: '#FF6B6B',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    badgeText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12,
    },
    listContent: {
        padding: 15,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    matchItem: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#eee',
        padding: 10,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    matchImage: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 10,
        marginBottom: 8,
    },
    matchName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
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
