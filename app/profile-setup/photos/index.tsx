import { Button } from '@/components/Button';
import { useApp } from '@/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfilePhotosScreen() {
    const router = useRouter();
    const [photos, setPhotos] = useState<(string | null)[]>(Array(6).fill(null));

    const pickImage = async (index: number) => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            const newPhotos = [...photos];
            newPhotos[index] = result.assets[0].uri;
            setPhotos(newPhotos);
        }
    };

    const removeImage = (index: number) => {
        const newPhotos = [...photos];
        newPhotos[index] = null;
        setPhotos(newPhotos);
    };

    const { updateUserProfile } = useApp();

    const handleContinue = () => {
        const hasPhotos = photos.some((photo) => photo !== null);
        if (hasPhotos) {
            updateUserProfile({ photos });
            router.push('/profile-setup/interests');
        } else {
            Alert.alert('Add Photos', 'Please add at least one photo to continue.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />
            <View style={styles.content}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.stepIndicator}>Step 2 of 3</Text>
                    <Text style={styles.title}>Add Photos</Text>
                    <Text style={styles.subtitle}>Add at least 2 photos to continue.</Text>
                </View>

                <View style={styles.grid}>
                    {photos.map((photo, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.photoSlot}
                            onPress={() => !photo && pickImage(index)}
                            activeOpacity={0.8}
                        >
                            {photo ? (
                                <>
                                    <Image source={{ uri: photo }} style={styles.image} />
                                    <TouchableOpacity
                                        style={styles.removeButton}
                                        onPress={() => removeImage(index)}
                                    >
                                        <Ionicons name="close" size={16} color="#fff" />
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <View style={styles.placeholder}>
                                    <Ionicons name="add" size={32} color="#FF6B6B" />
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.footer}>
                    <Button
                        title="Continue"
                        onPress={handleContinue}
                        disabled={!photos.some((p) => p !== null)}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    header: {
        marginTop: 20,
        marginBottom: 30,
    },
    backButton: {
        marginBottom: 20,
        alignSelf: 'flex-start',
        padding: 4,
        marginLeft: -4,
    },
    stepIndicator: {
        fontSize: 14,
        color: '#FF6B6B',
        fontWeight: '600',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        lineHeight: 24,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'space-between',
    },
    photoSlot: {
        width: '31%',
        aspectRatio: 0.75,
        borderRadius: 12,
        backgroundColor: '#F5F5F5',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderStyle: 'dashed',
    },
    placeholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    removeButton: {
        position: 'absolute',
        top: 6,
        right: 6,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footer: {
        marginTop: 'auto',
    },
});
