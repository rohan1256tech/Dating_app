import { useApp } from '@/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const PHOTO_SIZE = (width - 48 - 24) / 3; // 48 padding, 24 gap (12*2)

export default function ProfileScreen() {
    const { userProfile } = useApp();
    const router = useRouter();

    const handleLogout = () => {
        // Reset state logic would go here
        router.replace('/login');
    };

    const handleEdit = () => {
        // Navigate to edit profile or show modal
        // For now, let's just go back to basic info setup as a simple "Edit"
        router.push('/profile-setup/basic-info');
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Profile</Text>
                    <TouchableOpacity onPress={() => { }}>
                        <Ionicons name="settings-outline" size={24} color="#333" />
                    </TouchableOpacity>
                </View>

                <View style={styles.profileHeader}>
                    <View style={styles.avatarContainer}>
                        {userProfile.photos[0] ? (
                            <Image source={{ uri: userProfile.photos[0] }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, styles.avatarPlaceholder]}>
                                <Ionicons name="person" size={40} color="#ccc" />
                            </View>
                        )}
                        <TouchableOpacity style={styles.editBadge} onPress={handleEdit}>
                            <Ionicons name="pencil" size={16} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.name}>
                        {userProfile.name || 'User'}
                        {userProfile.age ? `, ${userProfile.age}` : ''}
                    </Text>
                    {userProfile.bio && <Text style={styles.bio}>{userProfile.bio}</Text>}
                </View>

                {/* Grid of Photos */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Photos</Text>
                        <TouchableOpacity onPress={handleEdit}>
                            <Text style={styles.editLink}>Edit</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.photosGrid}>
                        {userProfile.photos.map((photo, index) => (
                            photo ? (
                                <Image key={index} source={{ uri: photo }} style={styles.photoItem} />
                            ) : (
                                <View key={index} style={[styles.photoItem, styles.photoPlaceholder]}>
                                    <Ionicons name="add" size={24} color="#ccc" />
                                </View>
                            )
                        ))}
                    </View>
                </View>

                {/* Interests */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Interests</Text>
                        <TouchableOpacity onPress={() => router.push('/profile-setup/interests')}>
                            <Text style={styles.editLink}>Edit</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.interestsContainer}>
                        {userProfile.interests.map((interest, index) => (
                            <View key={index} style={styles.interestChip}>
                                <Text style={styles.interestText}>{interest}</Text>
                            </View>
                        ))}
                        {userProfile.interests.length === 0 && (
                            <Text style={styles.emptyText}>No interests added yet.</Text>
                        )}
                    </View>
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Log Out</Text>
                </TouchableOpacity>

                <View style={styles.versionContainer}>
                    <Text style={styles.versionText}>Version 1.0.0</Text>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 20,
    },
    headerTitle: {
        fontSize: 34,
        fontWeight: 'bold',
        color: '#333',
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: 30,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#f0f0f0',
    },
    avatarPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#FF6B6B',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    bio: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        paddingHorizontal: 40,
        lineHeight: 20,
    },
    section: {
        paddingHorizontal: 24,
        marginBottom: 30,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    editLink: {
        color: '#FF6B6B',
        fontWeight: '600',
        fontSize: 14,
    },
    photosGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    photoItem: {
        width: PHOTO_SIZE,
        height: PHOTO_SIZE,
        borderRadius: 12,
        backgroundColor: '#f0f0f0',
    },
    photoPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#eee',
        borderStyle: 'dashed',
    },
    interestsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    interestChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#FFF0F0',
        borderWidth: 1,
        borderColor: '#FFCDD2',
    },
    interestText: {
        color: '#FF6B6B',
        fontSize: 14,
        fontWeight: '500',
    },
    emptyText: {
        color: '#999',
        fontStyle: 'italic',
    },
    logoutButton: {
        marginHorizontal: 24,
        backgroundColor: '#FAFAFA',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#eee',
        marginBottom: 20,
    },
    logoutText: {
        color: '#FF6B6B',
        fontWeight: '600',
        fontSize: 16,
    },
    versionContainer: {
        alignItems: 'center',
    },
    versionText: {
        color: '#ccc',
        fontSize: 12,
    },
});
