import { borderRadius } from '@/constants/design-tokens';
import { useThemedColors } from '@/theme/ThemeProvider';
import React, { useEffect } from 'react';
import { DimensionValue, StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
    interpolate,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated';

interface SkeletonProps {
    width?: DimensionValue;
    height?: number;
    borderRadius?: number;
    style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    width = '100%',
    height = 20,
    borderRadius: radius = borderRadius.md,
    style,
}) => {
    const colors = useThemedColors();
    const shimmer = useSharedValue(0);

    useEffect(() => {
        shimmer.value = withRepeat(
            withTiming(1, { duration: 1500 }),
            -1,
            false
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        const translateX = interpolate(
            shimmer.value,
            [0, 1],
            [-200, 200]
        );

        return {
            transform: [{ translateX }],
        };
    });

    return (
        <View
            style={[
                styles.container,
                {
                    width,
                    height,
                    borderRadius: radius,
                    backgroundColor: colors.surface,
                    overflow: 'hidden',
                },
                style,
            ]}
        >
            <Animated.View
                style={[
                    styles.shimmer,
                    {
                        backgroundColor: colors.border,
                        opacity: 0.3,
                    },
                    animatedStyle,
                ]}
            />
        </View>
    );
};

// Preset skeleton layouts
export const SkeletonCard: React.FC<{ style?: ViewStyle }> = ({ style }) => {
    return (
        <View style={[styles.card, style]}>
            <Skeleton width="100%" height={200} borderRadius={borderRadius.lg} />
            <View style={styles.cardContent}>
                <Skeleton width="60%" height={24} />
                <Skeleton width="40%" height={16} style={{ marginTop: 8 }} />
                <Skeleton width="80%" height={16} style={{ marginTop: 8 }} />
            </View>
        </View>
    );
};

export const SkeletonProfileHeader: React.FC<{ style?: ViewStyle }> = ({ style }) => {
    return (
        <View style={[styles.profileHeader, style]}>
            <Skeleton width={80} height={80} borderRadius={borderRadius.full} />
            <View style={styles.profileInfo}>
                <Skeleton width="70%" height={20} />
                <Skeleton width="50%" height={16} style={{ marginTop: 8 }} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
    },
    shimmer: {
        width: 200,
        height: '100%',
    },
    card: {
        marginBottom: 16,
    },
    cardContent: {
        padding: 16,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    profileInfo: {
        marginLeft: 16,
        flex: 1,
    },
});
