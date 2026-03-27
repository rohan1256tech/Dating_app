import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class MapErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('MapErrorBoundary caught an error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={StyleSheet.absoluteFill} />
                    <LinearGradient colors={['rgba(255,107,107,0.15)', 'rgba(255,142,83,0.08)']} style={styles.errorIcon}>
                        <Ionicons name="map-outline" size={52} color="#FF6B6B" />
                    </LinearGradient>
                    <Text style={styles.errorTitle}>Map Unavailable</Text>
                    <Text style={styles.errorText}>Google Maps requires a production APK build to function correctly.</Text>
                    <Text style={styles.errorDetail}>{this.state.error?.message}</Text>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },
    errorIcon: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,107,107,0.3)',
    },
    errorTitle: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 12,
        letterSpacing: 0.5,
    },
    errorText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 12,
    },
    errorDetail: {
        color: 'rgba(255,107,107,0.8)',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 10,
    },
});
