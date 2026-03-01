import { pressConfig, springConfig } from '@/constants/animations';
import { borderRadius, spacing, typography } from '@/constants/design-tokens';
import { useThemedColors } from '@/theme/ThemeProvider';
import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    ViewStyle,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface ButtonProps {
    onPress: () => void;
    title: string;
    variant?: 'primary' | 'secondary' | 'ghost';
    size?: 'small' | 'medium' | 'large';
    disabled?: boolean;
    loading?: boolean;
    fullWidth?: boolean;
    style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
    onPress,
    title,
    variant = 'primary',
    size = 'medium',
    disabled = false,
    loading = false,
    fullWidth = false,
    style,
}) => {
    const colors = useThemedColors();
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);

    const handlePressIn = () => {
        scale.value = withTiming(pressConfig.scaleDown, { duration: pressConfig.duration });
        opacity.value = withTiming(pressConfig.opacity, { duration: pressConfig.duration });
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, springConfig.snappy);
        opacity.value = withTiming(1, { duration: pressConfig.duration });
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    const getBackgroundColor = () => {
        if (disabled) return colors.textDisabled;
        switch (variant) {
            case 'primary':
                return colors.primary;
            case 'secondary':
                return colors.surface;
            case 'ghost':
                return 'transparent';
            default:
                return colors.primary;
        }
    };

    const getTextColor = () => {
        if (disabled) return colors.textSecondary;
        switch (variant) {
            case 'primary':
                return '#FFFFFF';
            case 'secondary':
                return colors.text;
            case 'ghost':
                return colors.primary;
            default:
                return '#FFFFFF';
        }
    };

    const getSizeStyles = (): { container: ViewStyle; text: TextStyle } => {
        switch (size) {
            case 'small':
                return {
                    container: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
                    text: { fontSize: typography.fontSize.sm },
                };
            case 'medium':
                return {
                    container: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
                    text: { fontSize: typography.fontSize.base },
                };
            case 'large':
                return {
                    container: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xl },
                    text: { fontSize: typography.fontSize.lg },
                };
            default:
                return {
                    container: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
                    text: { fontSize: typography.fontSize.base },
                };
        }
    };

    const sizeStyles = getSizeStyles();

    return (
        <AnimatedTouchable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled || loading}
            style={[
                styles.button,
                sizeStyles.container,
                { backgroundColor: getBackgroundColor() },
                variant === 'secondary' && { borderWidth: 1, borderColor: colors.border },
                fullWidth && styles.fullWidth,
                animatedStyle,
                style,
            ]}
            activeOpacity={1}
        >
            {loading ? (
                <ActivityIndicator color={getTextColor()} />
            ) : (
                <Text
                    style={[
                        styles.text,
                        sizeStyles.text,
                        { color: getTextColor() },
                    ]}
                >
                    {title}
                </Text>
            )}
        </AnimatedTouchable>
    );
};

const styles = StyleSheet.create({
    button: {
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    fullWidth: {
        width: '100%',
    },
    text: {
        fontWeight: typography.fontWeight.semibold,
    },
});
