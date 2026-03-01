import { pressConfig, springConfig } from '@/constants/animations';
import { borderRadius, spacing, typography } from '@/constants/design-tokens';
import { useThemedColors } from '@/theme/ThemeProvider';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface ChipProps {
    label: string;
    onPress?: () => void;
    selected?: boolean;
    disabled?: boolean;
    variant?: 'filled' | 'outlined';
    size?: 'small' | 'medium';
    style?: ViewStyle;
}

export const Chip: React.FC<ChipProps> = ({
    label,
    onPress,
    selected = false,
    disabled = false,
    variant = 'filled',
    size = 'medium',
    style,
}) => {
    const colors = useThemedColors();
    const scale = useSharedValue(1);

    const handlePressIn = () => {
        scale.value = withTiming(pressConfig.scaleDown, { duration: pressConfig.duration });
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, springConfig.snappy);
    };

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const getBackgroundColor = () => {
        if (disabled) return colors.surface;
        if (selected) return colors.primary;
        if (variant === 'outlined') return 'transparent';
        return colors.surface;
    };

    const getTextColor = () => {
        if (disabled) return colors.textDisabled;
        if (selected) return '#FFFFFF';
        return colors.text;
    };

    const getBorderColor = () => {
        if (selected) return colors.primary;
        return colors.border;
    };

    const paddingSize = size === 'small' ? spacing.xs : spacing.sm;
    const fontSize = size === 'small' ? typography.fontSize.xs : typography.fontSize.sm;

    return (
        <AnimatedTouchable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled || !onPress}
            style={[
                styles.chip,
                {
                    backgroundColor: getBackgroundColor(),
                    borderColor: getBorderColor(),
                    paddingHorizontal: paddingSize * 2,
                    paddingVertical: paddingSize,
                },
                variant === 'outlined' && styles.outlined,
                animatedStyle,
                style,
            ]}
            activeOpacity={1}
        >
            <Text
                style={[
                    styles.label,
                    {
                        color: getTextColor(),
                        fontSize,
                    },
                ]}
            >
                {label}
            </Text>
        </AnimatedTouchable>
    );
};

const styles = StyleSheet.create({
    chip: {
        borderRadius: borderRadius.full,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    outlined: {
        borderWidth: 1,
    },
    label: {
        fontWeight: typography.fontWeight.medium,
    },
});
