import { useApp } from '@/context/AppContext';
import { CartoonAvatar } from '@/components/CartoonAvatar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useRef, useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

interface NearbyUser {
    userId: string;
    name: string;
    age: number;
    gender?: 'male' | 'female' | 'other';
    photo: string;
    location: { latitude: number; longitude: number };
    distance: number;
}

type PermissionState = 'idle' | 'requesting' | 'granted' | 'denied';

const THEME = {
    bg: ['#0f0c29', '#302b63', '#24243e'] as const,
    accent: '#FF6B6B',
    accentAlt: '#FF8E53',
    muted: 'rgba(255,255,255,0.55)',
    border: 'rgba(255,255,255,0.12)',
};

export default function MapScreen() {
    const { getNearbyUsers, updateMapLocation } = useApp();

    const [permissionState, setPermissionState] = useState<PermissionState>('idle');
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const mapRef = useRef<MapView>(null);

    // ── Request location lazily when tab is first focused ────────────────────
    useFocusEffect(
        useCallback(() => {
            if (permissionState === 'idle') {
                requestLocation();
            }
        }, [permissionState])
    );

    const requestLocation = async () => {
        setPermissionState('requesting');
        setLoading(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setPermissionState('denied');
                setLoading(false);
                return;
            }
            const currentLocation = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });
            setLocation(currentLocation);
            setPermissionState('granted');
        } catch {
            setPermissionState('denied');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleVisibility = async () => {
        if (!location) return;
        try {
            const newVisibility = !isVisible;
            await updateMapLocation(
                location.coords.latitude,
                location.coords.longitude,
                newVisibility
            );
            setIsVisible(newVisibility);
            if (newVisibility) await loadNearbyUsers();
            else setNearbyUsers([]);
        } catch {
            /* silent */
        }
    };

    const loadNearbyUsers = async () => {
        if (!location) return;
        try {
            setRefreshing(true);
            const users = await getNearbyUsers(5000);
            setNearbyUsers((users || []).filter(Boolean) as NearbyUser[]);
        } catch {
            /* silent */
        } finally {
            setRefreshing(false);
        }
    };

    const formatDistance = (meters: number) =>
        meters < 1000 ? `${meters}m` : `${(meters / 1000).toFixed(1)}km`;

    // ── Requesting location ───────────────────────────────────────────────────
    if (loading || permissionState === 'requesting') {
        return (
            <View style={styles.fullScreen}>
                <LinearGradient colors={THEME.bg} style={StyleSheet.absoluteFill} />
                <ActivityIndicator size="large" color={THEME.accent} />
                <Text style={styles.loadingText}>Getting your location…</Text>
            </View>
        );
    }

    // ── Permission denied ─────────────────────────────────────────────────────
    if (permissionState === 'denied') {
        return (
            <SafeAreaView style={styles.fullScreen}>
                <StatusBar style="light" />
                <LinearGradient colors={THEME.bg} style={StyleSheet.absoluteFill} />
                <LinearGradient
                    colors={['rgba(255,107,107,0.15)', 'rgba(255,142,83,0.08)']}
                    style={styles.permIcon}
                >
                    <Ionicons name="location-outline" size={56} color={THEME.accent} />
                </LinearGradient>
                <Text style={styles.permTitle}>Location Permission Required</Text>
                <Text style={styles.permText}>
                    To see people nearby, Detto needs access to your location.
                    {'\n'}Your location is never stored without your consent.
                </Text>
                <TouchableOpacity style={styles.permBtn} onPress={requestLocation}>
                    <LinearGradient
                        colors={[THEME.accent, THEME.accentAlt]}
                        style={styles.permBtnGrad}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Ionicons name="location" size={18} color="#fff" />
                        <Text style={styles.permBtnText}>Allow Location</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    // ── Waiting for first tab focus ───────────────────────────────────────────
    if (permissionState === 'idle' || !location) {
        return (
            <View style={styles.fullScreen}>
                <LinearGradient colors={THEME.bg} style={StyleSheet.absoluteFill} />
                <ActivityIndicator size="large" color={THEME.accent} />
            </View>
        );
    }

    // ── Main Map ──────────────────────────────────────────────────────────────
    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={{
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                }}
                showsUserLocation
                showsMyLocationButton={false}
            >
                {nearbyUsers.map((user) => (
                    <Marker
                        key={user.userId}
                        coordinate={user.location}
                        title={user.name}
                        description={`${user.age} · ${formatDistance(user.distance)}`}
                    >
                        <View style={styles.markerWrapper}>
                            <CartoonAvatar
                                seed={user.userId}
                                gender={user.gender}
                                size={44}
                            />
                            <View style={styles.markerTail} />
                        </View>
                    </Marker>
                ))}
            </MapView>

            {/* Ghost-mode overlay when not visible */}
            {!isVisible && (
                <View style={styles.ghostOverlay} pointerEvents="none">
                    <LinearGradient
                        colors={['rgba(15,12,41,0.82)', 'transparent']}
                        style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.ghostBadge}>
                        <Ionicons name="eye-off" size={14} color="rgba(255,255,255,0.7)" />
                        <Text style={styles.ghostText}>Ghost Mode — You are invisible</Text>
                    </View>
                </View>
            )}

            {/* Refresh button */}
            {isVisible && (
                <TouchableOpacity style={styles.refreshFab} onPress={loadNearbyUsers} disabled={refreshing}>
                    <LinearGradient colors={[THEME.accent, THEME.accentAlt]} style={styles.fabGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                        {refreshing
                            ? <ActivityIndicator size="small" color="#fff" />
                            : <Ionicons name="refresh" size={20} color="#fff" />}
                    </LinearGradient>
                </TouchableOpacity>
            )}

            {/* Visibility toggle */}
            <View style={styles.bottomBar}>
                <TouchableOpacity style={[styles.visibilityBtn, isVisible && styles.visibilityBtnActive]} onPress={handleToggleVisibility}>
                    <LinearGradient
                        colors={isVisible ? [THEME.accent, THEME.accentAlt] : ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
                        style={styles.visibilityBtnGrad}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Ionicons
                            name={isVisible ? 'eye' : 'eye-off'}
                            size={18}
                            color={isVisible ? '#fff' : 'rgba(255,255,255,0.6)'}
                        />
                        <Text style={[styles.visibilityText, isVisible && styles.visibilityTextActive]}>
                            {isVisible ? 'Visible to others' : 'Go Visible'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    fullScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
    map: { flex: 1 },

    // Permission denied
    permIcon: {
        width: 110, height: 110, borderRadius: 55,
        justifyContent: 'center', alignItems: 'center', marginBottom: 8,
    },
    permTitle: { fontSize: 22, fontWeight: '800', color: '#fff', textAlign: 'center', paddingHorizontal: 24 },
    permText: {
        fontSize: 15, color: 'rgba(255,255,255,0.6)', textAlign: 'center',
        lineHeight: 22, paddingHorizontal: 32,
    },
    permBtn: { borderRadius: 30, overflow: 'hidden', marginTop: 8 },
    permBtnGrad: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 32, paddingVertical: 14 },
    permBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

    // Loading
    loadingText: { color: 'rgba(255,255,255,0.6)', fontSize: 15, marginTop: 8 },

    // Markers
    markerWrapper: { alignItems: 'center' },
    markerTail: {
        width: 0, height: 0,
        borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 8,
        borderLeftColor: 'transparent', borderRightColor: 'transparent',
        borderTopColor: '#FF6B6B',
    },

    // Ghost overlay
    ghostOverlay: {
        position: 'absolute', top: 0, left: 0, right: 0,
        paddingTop: 48, alignItems: 'center',
    },
    ghostBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: 'rgba(15,12,41,0.85)',
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    },
    ghostText: { color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: '500' },

    // FAB
    refreshFab: {
        position: 'absolute', top: 16, right: 16,
        borderRadius: 24, overflow: 'hidden',
        shadowColor: '#FF6B6B', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
    },
    fabGrad: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },

    // Bottom bar
    bottomBar: {
        position: 'absolute', bottom: 24, left: 20, right: 20,
        alignItems: 'center',
    },
    visibilityBtn: { borderRadius: 30, overflow: 'hidden', width: '100%' },
    visibilityBtnActive: {
        shadowColor: '#FF6B6B', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
    },
    visibilityBtnGrad: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, paddingVertical: 16,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', borderRadius: 30,
    },
    visibilityText: { color: 'rgba(255,255,255,0.6)', fontWeight: '700', fontSize: 16 },
    visibilityTextActive: { color: '#fff' },
});
