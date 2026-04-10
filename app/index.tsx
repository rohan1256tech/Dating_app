import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

export default function SplashScreen() {
  const router = useRouter();
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1,
      true
    );

    const checkAuth = async () => {
      try {
        const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
        const token = await AsyncStorage.getItem('accessToken');
        setTimeout(() => {
          if (token) {
            router.replace('/(tabs)');
          } else {
            router.replace('/onboarding');
          }
        }, 2200); // Keep the splash screen duration
      } catch (e) {
        setTimeout(() => router.replace('/onboarding'), 2200);
      }
    };

    checkAuth();
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0f0c29', '#302b63', '#24243e']} style={StyleSheet.absoluteFill} />
      <Animated.View entering={FadeIn.duration(1000)} style={styles.content}>
        <Animated.View style={[styles.logoRing, pulseStyle]}>
          <LinearGradient colors={['#FF6B6B', '#FF8E53']} style={styles.logoGrad}>
            <Ionicons name="heart" size={48} color="#fff" />
          </LinearGradient>
        </Animated.View>
        <Text style={styles.appName}>WhatsLeft</Text>
        <Text style={styles.tagline}>Find your perfect match</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { alignItems: 'center', gap: 16 },
  logoRing: {
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 30,
    elevation: 16,
    marginBottom: 8,
  },
  logoGrad: {
    width: 110,
    height: 110,
    borderRadius: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    fontSize: 44,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
