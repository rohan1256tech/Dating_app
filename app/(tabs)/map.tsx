import { useApp } from '@/context/AppContext';
import { CartoonAvatar } from '@/components/CartoonAvatar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';
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

export default function MapScreen() {
    const { getNearbyUsers, updateMapLocation } = useApp();
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [isVisible, setIsVisible] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const mapRef = useRef<MapView>(null);

    useEffect(() => { requestLocationPermission(); }, []);

    const requestLocationPermission = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Location Permission', 'We need location permission to show nearby users', [{ text: 'OK' }]);
                setLoading(false);
                return;
            }
            const currentLocation = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });
            setLocation(currentLocation);
            setLoading(false);
        } catch (error) {
            setLoading(false);
            Alert.alert('Error', 'Could not get your location');
        }
    };

    const handleToggleVisibility = async () => {
        if (!location) { Alert.alert('Error', 'Location not available'); return; }
        try {
            const newVisibility = !isVisible;
            await updateMapLocation(location.coords.latitude, location.coords.longitude, newVisibility);
            setIsVisible(newVisibility);
            if (newVisibility) await loadNearbyUsers();
            else setNearbyUsers([]);
        } catch {
            Alert.alert('Error', 'Could not update visibility');
        }
    };

    const loadNearbyUsers = async () => {
        if (!location) return;
        try {
            setRefreshing(true);
            const users = await getNearbyUsers(5000);
            setNearbyUsers((users || []).filter(Boolean) as NearbyUser[]);
        } catch { /* silent */ } finally { setRefreshing(false); }
    };

    const formatDistance = (meters: number) =>
        meters < 1000 ? `${meters}m` : `${(meters / 1000).toFixed(1)}km`;

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <View style={styles.fullScreen}>
                <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={StyleSheet.absoluteFill} />
                <ActivityIndicator size="large" color="#FF6B6B" />
                <Text style={styles.loadingText}>Finding your location…</Text>
            </View>
        );
    }

    // ── No permission / location unavailable ─────────────────────────────────
    if (!location) {
        return (
            <View style={styles.fullScreen}>
                <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={StyleSheet.absoluteFill} />
                <LinearGradient colors={['rgba(255,107,107,0.15)', 'rgba(255,142,83,0.08)']} style={styles.errorIcon}>
                    <Ionicons name="location-outline" size={52} color="#FF6B6B" />
                </LinearGradient>
                <Text style={styles.errorTitle}>Location Required</Text>
                <Text style={styles.errorText}>Enable location services to use the map</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={requestLocationPermission}>
                    <LinearGradient colors={['#FF6B6B', '#FF8E53']} style={styles.retryGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                        <Ionicons name="refresh" size={18} color="#fff" />
                        <Text style={styles.retryText}>Try Again</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        );
    }

    // ── Main map ─────────────────────────────────────────────────────────────
    // Use PROVIDER_GOOGLE on Android only — iOS and emulators use the safe default
    const mapProvider = Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT;

    return (
        <View style={styles.container}>
            <StatusBar style="light" />

            <MapView
                ref={mapRef}
                provider={mapProvider}
                style={styles.map}
                initialRegion={{
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }}
                showsUserLocation={false}
                showsMyLocationButton={false}
                showsCompass={false}
                showsTraffic={false}
                showsBuildings={false}
            >
                {/* Current user marker */}
                <Marker
                    coordinate={{
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                    }}
                    title="You"
                    description={isVisible ? 'Visible on map' : 'Ghost mode'}
                >
                    <View style={styles.myMarker}>
                        <LinearGradient colors={['#FF6B6B', '#FF8E53']} style={styles.myMarkerGrad}>
                            <Ionicons name="person" size={20} color="#fff" />
                        </LinearGradient>
                        <View style={styles.myMarkerPulse} />
                    </View>
                </Marker>

                {/* Nearby users */}
                {nearbyUsers.map((user) => (
                    <Marker
                        key={user.userId}
                        coordinate={user.location}
                        title={`${user.name}, ${user.age}`}
                        description={formatDistance(user.distance)}
                    >
                        <View style={styles.userMarker}>
                            <View style={styles.userMarkerRing}>
                                <CartoonAvatar gender={user.gender} name={user.name} size={44} />
                            </View>
                            <View style={styles.distancePill}>
                                <Text style={styles.distanceText}>{formatDistance(user.distance)}</Text>
                            </View>
                        </View>
                    </Marker>
                ))}
            </MapView>

            {/* Top header bar */}
            <SafeAreaView style={styles.topBar} pointerEvents="box-none">
                <View style={styles.headerCard}>
                    <View style={styles.headerLeft}>
                        <LinearGradient colors={['#FF6B6B', '#FF8E53']} style={styles.headerIcon}>
                            <Ionicons name="map" size={16} color="#fff" />
                        </LinearGradient>
                        <Text style={styles.headerTitle}>Nearby</Text>
                    </View>
                    {isVisible && (
                        <View style={styles.nearbyBadge}>
                            <Ionicons name="people" size={14} color="#FF6B6B" />
                            <Text style={styles.nearbyCount}>{nearbyUsers.length}</Text>
                        </View>
                    )}
                </View>
            </SafeAreaView>

            {/* Bottom controls */}
            <View style={styles.bottomControls}>
                {/* Visibility toggle */}
                <TouchableOpacity style={styles.visibilityBtn} onPress={handleToggleVisibility} activeOpacity={0.85}>
                    {isVisible
                        ? <LinearGradient colors={['#FF6B6B', '#FF8E53']} style={styles.visibilityBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                            <Ionicons name="eye" size={20} color="#fff" />
                            <Text style={styles.visibilityTextActive}>Visible</Text>
                        </LinearGradient>
                        : <View style={styles.visibilityBtnInnerGhost}>
                            <Ionicons name="eye-off" size={20} color="rgba(255,255,255,0.6)" />
                            <Text style={styles.visibilityTextGhost}>Ghost Mode</Text>
                        </View>
                    }
                </TouchableOpacity>

                {/* Refresh */}
                {isVisible && (
                    <TouchableOpacity style={styles.refreshBtn} onPress={loadNearbyUsers} disabled={refreshing} activeOpacity={0.8}>
                        <Ionicons name="refresh" size={20} color={refreshing ? 'rgba(255,255,255,0.25)' : '#FF6B6B'} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Ghost mode overlay */}
            {!isVisible && (
                <View style={styles.ghostOverlay} pointerEvents="box-none">
                    <View style={styles.ghostCard}>
                        <LinearGradient colors={['rgba(255,107,107,0.12)', 'rgba(255,142,83,0.06)']} style={styles.ghostIconBg}>
                            <Ionicons name="eye-off" size={36} color="rgba(255,255,255,0.5)" />
                        </LinearGradient>
                        <Text style={styles.ghostTitle}>Ghost Mode</Text>
                        <Text style={styles.ghostSub}>You're invisible. Tap below to appear on the map and discover people nearby.</Text>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0f0c29' },
    fullScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
    loadingText: { color: 'rgba(255,255,255,0.55)', fontSize: 16, marginTop: 8 },
    errorIcon: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    errorTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
    errorText: { fontSize: 15, color: 'rgba(255,255,255,0.55)', textAlign: 'center', paddingHorizontal: 40 },
    retryBtn: { borderRadius: 28, overflow: 'hidden', marginTop: 8 },
    retryGrad: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 28, paddingVertical: 14 },
    retryText: { color: '#fff', fontSize: 16, fontWeight: '700' },

    map: { flex: 1 },

    // Top header
    topBar: { position: 'absolute', top: 0, left: 0, right: 0 },
    headerCard: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        marginHorizontal: 16, marginTop: 8,
        backgroundColor: 'rgba(15,12,41,0.88)',
        borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerIcon: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
    nearbyBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 5,
        backgroundColor: 'rgba(255,107,107,0.15)',
        borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4,
        borderWidth: 1, borderColor: 'rgba(255,107,107,0.3)',
    },
    nearbyCount: { color: '#FF6B6B', fontWeight: '700', fontSize: 14 },

    // Bottom controls
    bottomControls: {
        position: 'absolute', bottom: 40, left: 16, right: 16,
        flexDirection: 'row', alignItems: 'center', gap: 12,
    },
    visibilityBtn: {
        flex: 1, borderRadius: 24, overflow: 'hidden',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    },
    visibilityBtnInner: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, paddingVertical: 14,
    },
    visibilityBtnInnerGhost: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, paddingVertical: 14,
        backgroundColor: 'rgba(15,12,41,0.88)',
    },
    visibilityTextActive: { color: '#fff', fontWeight: '700', fontSize: 16 },
    visibilityTextGhost: { color: 'rgba(255,255,255,0.6)', fontWeight: '700', fontSize: 16 },
    refreshBtn: {
        width: 52, height: 52, borderRadius: 26,
        backgroundColor: 'rgba(15,12,41,0.88)',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    },

    // Markers
    myMarker: { alignItems: 'center', justifyContent: 'center' },
    myMarkerGrad: {
        width: 44, height: 44, borderRadius: 22,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 3, borderColor: 'rgba(255,255,255,0.9)',
    },
    myMarkerPulse: {
        position: 'absolute', width: 60, height: 60, borderRadius: 30,
        backgroundColor: 'rgba(255,107,107,0.2)',
        borderWidth: 1.5, borderColor: 'rgba(255,107,107,0.4)',
    },
    userMarker: { alignItems: 'center' },
    userMarkerRing: {
        borderRadius: 28, borderWidth: 2.5, borderColor: '#FF6B6B',
        overflow: 'hidden',
        shadowColor: '#FF6B6B', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5, shadowRadius: 6, elevation: 6,
    },
    distancePill: {
        marginTop: 4, backgroundColor: 'rgba(15,12,41,0.9)',
        paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
        borderWidth: 1, borderColor: 'rgba(255,107,107,0.5)',
    },
    distanceText: { fontSize: 10, fontWeight: '700', color: '#FF6B6B' },

    // Ghost overlay
    ghostOverlay: {
        position: 'absolute', top: '22%', left: 0, right: 0,
        alignItems: 'center',
    },
    ghostCard: {
        backgroundColor: 'rgba(15,12,41,0.92)',
        padding: 28, borderRadius: 24, alignItems: 'center',
        marginHorizontal: 32, maxWidth: 320,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
        gap: 10,
    },
    ghostIconBg: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
    ghostTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
    ghostSub: { fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 20 },
});
