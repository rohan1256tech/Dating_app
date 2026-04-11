import { CartoonAvatar } from '@/components/CartoonAvatar';
import { useApp } from '@/context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

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
    card: 'rgba(15,12,41,0.92)',
};

// ── Custom Marker for self ────────────────────────────────────────────────────
function SelfMarker() {
    const pulse = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1.25, duration: 900, useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
            ])
        ).start();
    }, [pulse]);

    return (
        <View style={marker.wrapper}>
            <Animated.View style={[marker.ring, { transform: [{ scale: pulse }] }]} />
            <View style={marker.dot}>
                <LinearGradient colors={['#FF6B6B', '#FF8E53']} style={marker.dotGrad}>
                    <Ionicons name="person" size={16} color="#fff" />
                </LinearGradient>
            </View>
            <View style={marker.tail} />
        </View>
    );
}

const marker = StyleSheet.create({
    wrapper: { alignItems: 'center' },
    ring: {
        position: 'absolute',
        width: 54,
        height: 54,
        borderRadius: 27,
        borderWidth: 2,
        borderColor: 'rgba(255,107,107,0.45)',
        top: -5,
    },
    dot: {
        width: 44,
        height: 44,
        borderRadius: 22,
        overflow: 'hidden',
        borderWidth: 3,
        borderColor: '#fff',
        shadowColor: '#FF6B6B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
        elevation: 8,
    },
    dotGrad: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tail: {
        width: 0,
        height: 0,
        borderLeftWidth: 6,
        borderRightWidth: 6,
        borderTopWidth: 9,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: '#FF6B6B',
        marginTop: -1,
    },
});

// ── User Marker ────────────────────────────────────────────────────────────────
function UserMarker({ user, onPress }: { user: NearbyUser; onPress: () => void }) {
    return (
        <TouchableOpacity style={umarker.wrapper} onPress={onPress} activeOpacity={0.85}>
            <View style={umarker.bubble}>
                <CartoonAvatar name={user.userId} gender={user.gender} size={44} />
                <View style={umarker.distBadge}>
                    <Text style={umarker.distText}>{formatDistance(user.distance)}</Text>
                </View>
            </View>
            <View style={umarker.tail} />
        </TouchableOpacity>
    );
}

const umarker = StyleSheet.create({
    wrapper: { alignItems: 'center' },
    bubble: {
        backgroundColor: '#fff',
        borderRadius: 28,
        padding: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8,
    },
    distBadge: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        backgroundColor: '#FF6B6B',
        borderRadius: 10,
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    distText: { color: '#fff', fontSize: 9, fontWeight: '700' },
    tail: {
        width: 0,
        height: 0,
        borderLeftWidth: 5,
        borderRightWidth: 5,
        borderTopWidth: 8,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: '#fff',
        marginTop: -1,
    },
});

function formatDistance(meters: number) {
    return meters < 1000 ? `${meters}m` : `${(meters / 1000).toFixed(1)}km`;
}

// ── Selected User Card ──────────────────────────────────────────────────────
function UserCard({ user, onClose }: { user: NearbyUser; onClose: () => void }) {
    return (
        <View style={ucard.container}>
            <LinearGradient colors={['rgba(15,12,41,0.95)', 'rgba(48,43,99,0.95)']} style={ucard.card}>
                <CartoonAvatar name={user.userId} gender={user.gender} size={56} />
                <View style={ucard.info}>
                    <Text style={ucard.name}>{user.name}</Text>
                    <View style={ucard.row}>
                        <Ionicons name="location" size={13} color="#FF6B6B" />
                        <Text style={ucard.meta}>{formatDistance(user.distance)} away</Text>
                        {user.age > 0 && <Text style={ucard.meta}>· {user.age} yrs</Text>}
                    </View>
                </View>
                <TouchableOpacity onPress={onClose} style={ucard.closeBtn}>
                    <Ionicons name="close" size={18} color="rgba(255,255,255,0.6)" />
                </TouchableOpacity>
            </LinearGradient>
        </View>
    );
}

const ucard = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 110,
        left: 16,
        right: 16,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 12,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        borderRadius: 20,
    },
    info: { flex: 1 },
    name: { fontSize: 17, fontWeight: '700', color: '#fff', marginBottom: 4 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    meta: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.08)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

// ── Stat Badge ────────────────────────────────────────────────────────────────
function StatBadge({ count }: { count: number }) {
    return (
        <View style={stat.container}>
            <Ionicons name="people" size={14} color="#FF6B6B" />
            <Text style={stat.text}>{count} nearby</Text>
        </View>
    );
}

const stat = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 16,
        left: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(15,12,41,0.88)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
    },
    text: { color: '#fff', fontSize: 13, fontWeight: '600' },
});

// ═══════════════════════════════════════════════════════════════════════════════
const LOCATION_CACHE_KEY = 'detto_last_location';

export default function MapScreen() {
    const { getNearbyUsers, updateMapLocation, userProfile } = useApp();

    const [permissionState, setPermissionState] = useState<PermissionState>('idle');
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedUser, setSelectedUser] = useState<NearbyUser | null>(null);
    const mapRef = useRef<MapView>(null);
    const locationSubscription = useRef<Location.LocationSubscription | null>(null);

    // ── Restore last-known location from cache on first render ────────────────
    useEffect(() => {
        AsyncStorage.getItem(LOCATION_CACHE_KEY).then((cached) => {
            if (cached) {
                try {
                    const coords = JSON.parse(cached);
                    // Reconstruct a minimal LocationObject from cache
                    setLocation({
                        coords: { ...coords, altitude: null, altitudeAccuracy: null, heading: null, speed: null, accuracy: 0 },
                        timestamp: Date.now(),
                    } as any);
                } catch { /* ignore bad cache */ }
            }
        });
        return () => {
            // Stop watching position when unmounting
            locationSubscription.current?.remove();
        };
    }, []);

    // ── Request location lazily when tab is first focused ─────────────────────
    useFocusEffect(
        useCallback(() => {
            if (permissionState === 'idle') {
                requestLocation();
            } else if (permissionState === 'granted' && location && isVisible) {
                // Auto-reload nearby users only when visible and location is ready
                loadNearbyUsers();
            }
        }, [permissionState, location, isVisible])
    );

    const requestLocation = async () => {
        setPermissionState('requesting');
        setLoading(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setPermissionState('denied');
                // Don't call loadNearbyUsers here — user has no server location anyway
                setLoading(false);
                return;
            }
            // Get a fast first fix
            const currentLocation = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });
            setLocation(currentLocation);
            setPermissionState('granted');

            // Cache it for fast restores next time
            await AsyncStorage.setItem(
                LOCATION_CACHE_KEY,
                JSON.stringify({ latitude: currentLocation.coords.latitude, longitude: currentLocation.coords.longitude })
            );

            // Start a live watch so location stays fresh while map is open.
            // Snapchat-style: we only upload to server when ghost mode is OFF.
            locationSubscription.current?.remove();
            locationSubscription.current = await Location.watchPositionAsync(
                { accuracy: Location.Accuracy.Balanced, distanceInterval: 30 },
                (loc) => {
                    setLocation(loc);
                    // Persist latest position to cache
                    AsyncStorage.setItem(
                        LOCATION_CACHE_KEY,
                        JSON.stringify({ latitude: loc.coords.latitude, longitude: loc.coords.longitude })
                    );
                    // ── Snapchat rule: only push to server when user is VISIBLE ──
                    // (isVisible is captured via closure — see handleToggleVisibility)
                }
            );

            // Only load nearby if user is visible (has shared location on server)
            if (isVisible) {
                await loadNearbyUsers();
            }
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
            if (newVisibility) {
                // Going VISIBLE — push current location to server (Snapchat: appear on map)
                await updateMapLocation(
                    location.coords.latitude,
                    location.coords.longitude,
                    true
                );
                await loadNearbyUsers();
            } else {
                // Going GHOST — tell server to hide us; do NOT send location anymore
                await updateMapLocation(
                    location.coords.latitude,
                    location.coords.longitude,
                    false
                );
            }
            setIsVisible(newVisibility);
        } catch {
            /* silent */
        }
    };

    const loadNearbyUsers = async () => {
        // Don't call API if we have no location at all — avoid 500 spam
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

    // ── Loading ───────────────────────────────────────────────────────────────
    if (loading || permissionState === 'requesting') {
        return (
            <View style={styles.fullScreen}>
                <LinearGradient colors={THEME.bg} style={StyleSheet.absoluteFill} />
                <View style={styles.loadingContent}>
                    <LinearGradient colors={['rgba(255,107,107,0.2)', 'rgba(255,142,83,0.1)']} style={styles.loadingIcon}>
                        <Ionicons name="location-outline" size={40} color={THEME.accent} />
                    </LinearGradient>
                    <ActivityIndicator size="large" color={THEME.accent} style={{ marginTop: 4 }} />
                    <Text style={styles.loadingTitle}>Finding people near you</Text>
                    <Text style={styles.loadingText}>Getting your location…</Text>
                </View>
            </View>
        );
    }

    // ── Permission denied — still show map with others ─────────────────────────
    if (permissionState === 'denied') {
        return (
            <View style={styles.container}>
                <StatusBar style="light" />
                {/* Still show map so users can see others */}
                <MapView
                    provider={PROVIDER_GOOGLE}
                    style={styles.map}
                    initialRegion={{
                        latitude: 20.5937,
                        longitude: 78.9629,
                        latitudeDelta: 10,
                        longitudeDelta: 10,
                    }}
                    showsUserLocation={false}
                    showsMyLocationButton={false}
                >
                    {nearbyUsers.map((user) => (
                        <Marker
                            key={user.userId}
                            coordinate={user.location}
                            onPress={() => setSelectedUser(user)}
                        >
                            <UserMarker user={user} onPress={() => setSelectedUser(user)} />
                        </Marker>
                    ))}
                </MapView>

                {/* Permission denied banner */}
                <SafeAreaView pointerEvents="box-none" style={StyleSheet.absoluteFill}>
                    <View style={styles.deniedBanner}>
                        <Ionicons name="location-outline" size={18} color="#FFD700" />
                        <Text style={styles.deniedBannerText}>Location off — you're invisible to others</Text>
                        <TouchableOpacity onPress={requestLocation} style={styles.deniedBannerBtn}>
                            <Text style={styles.deniedBannerBtnText}>Enable</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>

                {nearbyUsers.length > 0 && <StatBadge count={nearbyUsers.length} />}
                {selectedUser && (
                    <UserCard user={selectedUser} onClose={() => setSelectedUser(null)} />
                )}
            </View>
        );
    }

    // ── Idle / no location yet ────────────────────────────────────────────────
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
                    latitudeDelta: 0.015,
                    longitudeDelta: 0.015,
                }}
                showsUserLocation={false}
                showsMyLocationButton={false}
            >
                {/* Self marker */}
                <Marker
                    coordinate={{
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                    }}
                    anchor={{ x: 0.5, y: 1 }}
                >
                    <SelfMarker />
                </Marker>

                {/* Nearby users */}
                {nearbyUsers.map((user) => (
                    <Marker
                        key={user.userId}
                        coordinate={user.location}
                        anchor={{ x: 0.5, y: 1 }}
                        onPress={() => setSelectedUser(user)}
                    >
                        <UserMarker user={user} onPress={() => setSelectedUser(user)} />
                    </Marker>
                ))}
            </MapView>

            {/* Ghost mode top banner */}
            {!isVisible && (
                <SafeAreaView pointerEvents="none" style={styles.ghostBannerWrapper}>
                    <View style={styles.ghostBanner}>
                        <LinearGradient
                            colors={['rgba(15,12,41,0.0)', 'rgba(15,12,41,0.6)']}
                            style={StyleSheet.absoluteFill}
                        />
                        <View style={styles.ghostBadge}>
                            <Ionicons name="eye-off" size={15} color="#FFD700" />
                            <Text style={styles.ghostText}>Ghost Mode — You're invisible to others</Text>
                        </View>
                    </View>
                </SafeAreaView>
            )}

            {/* Stat badge */}
            {isVisible && nearbyUsers.length > 0 && <StatBadge count={nearbyUsers.length} />}

            {/* Refresh FAB */}
            <TouchableOpacity
                style={[styles.refreshFab, !isVisible && { opacity: 0.5 }]}
                onPress={loadNearbyUsers}
                disabled={refreshing}
            >
                <LinearGradient
                    colors={[THEME.accent, THEME.accentAlt]}
                    style={styles.fabGrad}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    {refreshing
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <Ionicons name="refresh" size={20} color="#fff" />}
                </LinearGradient>
            </TouchableOpacity>

            {/* Center-on-me FAB */}
            <TouchableOpacity
                style={styles.locateFab}
                onPress={() => {
                    mapRef.current?.animateToRegion({
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                        latitudeDelta: 0.015,
                        longitudeDelta: 0.015,
                    }, 500);
                }}
            >
                <LinearGradient
                    colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.06)']}
                    style={styles.fabGrad}
                >
                    <Ionicons name="navigate" size={20} color="#fff" />
                </LinearGradient>
            </TouchableOpacity>

            {/* Selected user popup */}
            {selectedUser && (
                <UserCard user={selectedUser} onClose={() => setSelectedUser(null)} />
            )}

            {/* Bottom toggle bar */}
            <SafeAreaView edges={['bottom']} style={styles.bottomSafe}>
                <View style={styles.bottomBar}>
                    {/* Ghost mode info */}
                    <View style={[styles.infoChip, isVisible && styles.infoChipVisible]}>
                        <Ionicons
                            name={isVisible ? 'eye' : 'eye-off'}
                            size={14}
                            color={isVisible ? '#4CAF50' : 'rgba(255,255,255,0.5)'}
                        />
                        <Text style={[styles.infoChipText, isVisible && styles.infoChipTextVisible]}>
                            {isVisible
                                ? `Sharing location · ${nearbyUsers.length} nearby`
                                : 'Ghost Mode active'}
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.visibilityBtn, isVisible && styles.visibilityBtnActive]}
                        onPress={handleToggleVisibility}
                        activeOpacity={0.85}
                    >
                        <LinearGradient
                            colors={isVisible
                                ? [THEME.accent, THEME.accentAlt]
                                : ['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.06)']}
                            style={styles.visibilityBtnGrad}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                        >
                            <Ionicons
                                name={isVisible ? 'eye' : 'eye-off-outline'}
                                size={20}
                                color={isVisible ? '#fff' : 'rgba(255,255,255,0.7)'}
                            />
                            <Text style={[styles.visibilityText, isVisible && styles.visibilityTextActive]}>
                                {isVisible ? 'Go Ghost' : 'Go Visible'}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    fullScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
    map: { flex: 1 },

    // Loading
    loadingContent: { alignItems: 'center', gap: 16 },
    loadingIcon: {
        width: 88,
        height: 88,
        borderRadius: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
    loadingText: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },

    // Denied banner
    deniedBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginHorizontal: 16,
        marginTop: 12,
        backgroundColor: 'rgba(15,12,41,0.92)',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.3)',
    },
    deniedBannerText: {
        flex: 1,
        color: 'rgba(255,255,255,0.8)',
        fontSize: 13,
        fontWeight: '500',
    },
    deniedBannerBtn: {
        backgroundColor: '#FF6B6B',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    deniedBannerBtnText: { color: '#fff', fontWeight: '700', fontSize: 12 },

    // Ghost banner
    ghostBannerWrapper: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    },
    ghostBanner: {
        alignItems: 'center',
        paddingTop: 8,
    },
    ghostBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        backgroundColor: 'rgba(15,12,41,0.88)',
        paddingHorizontal: 16,
        paddingVertical: 9,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.3)',
        margin: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    ghostText: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600' },

    // FABs
    refreshFab: {
        position: 'absolute',
        top: 16,
        right: 16,
        borderRadius: 24,
        overflow: 'hidden',
        shadowColor: '#FF6B6B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
    locateFab: {
        position: 'absolute',
        top: 72,
        right: 16,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        elevation: 4,
    },
    fabGrad: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },

    // Bottom bar
    bottomSafe: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    bottomBar: {
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: 8,
        gap: 10,
        backgroundColor: 'rgba(10,8,28,0.72)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.08)',
    },
    infoChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        alignSelf: 'flex-start',
    },
    infoChipVisible: { borderColor: 'rgba(76,175,80,0.3)', backgroundColor: 'rgba(76,175,80,0.08)' },
    infoChipText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '500' },
    infoChipTextVisible: { color: '#4CAF50' },

    visibilityBtn: {
        borderRadius: 30,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
    },
    visibilityBtnActive: {
        borderColor: THEME.accent,
        shadowColor: '#FF6B6B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
        elevation: 8,
    },
    visibilityBtnGrad: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 16,
        borderRadius: 30,
    },
    visibilityText: { color: 'rgba(255,255,255,0.7)', fontWeight: '700', fontSize: 16 },
    visibilityTextActive: { color: '#fff' },
});
