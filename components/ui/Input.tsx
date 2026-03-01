import { borderRadius, spacing, typography } from '@/constants/design-tokens';
import { useThemedColors } from '@/theme/ThemeProvider';
import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    View,
    ViewStyle,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    helperText?: string;
    containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    helperText,
    containerStyle,
    onFocus,
    onBlur,
    ...props
}) => {
    const colors = useThemedColors();
    const [isFocused, setIsFocused] = useState(false);
    const labelPosition = useSharedValue(props.value ? 1 : 0);

    const handleFocus = (e: any) => {
        setIsFocused(true);
        labelPosition.value = withTiming(1, { duration: 200 });
        onFocus?.(e);
    };

    const handleBlur = (e: any) => {
        setIsFocused(false);
        if (!props.value) {
            labelPosition.value = withTiming(0, { duration: 200 });
        }
        onBlur?.(e);
    };

    const labelStyle = useAnimatedStyle(() => ({
        top: labelPosition.value === 1 ? -8 : 16,
        fontSize: labelPosition.value === 1 ? typography.fontSize.xs : typography.fontSize.base,
        backgroundColor: labelPosition.value === 1 ? colors.background : 'transparent',
        paddingHorizontal: labelPosition.value === 1 ? 4 : 0,
    }));

    const getBorderColor = () => {
        if (error) return colors.error;
        if (isFocused) return colors.primary;
        return colors.border;
    };

    return (
        <View style={[styles.container, containerStyle]}>
            {label && (
                <Animated.Text
                    style={[
                        styles.label,
                        { color: error ? colors.error : isFocused ? colors.primary : colors.textSecondary },
                        labelStyle,
                    ]}
                >
                    {label}
                </Animated.Text>
            )}
            <TextInput
                {...props}
                onFocus={handleFocus}
                onBlur={handleBlur}
                style={[
                    styles.input,
                    {
                        borderColor: getBorderColor(),
                        color: colors.text,
                        backgroundColor: colors.surface,
                    },
                    props.style,
                ]}
                placeholderTextColor={colors.textSecondary}
            />
            {error && <Text style={[styles.helperText, { color: colors.error }]}>{error}</Text>}
            {helperText && !error && (
                <Text style={[styles.helperText, { color: colors.textSecondary }]}>{helperText}</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        marginBottom: spacing.md,
    },
    label: {
        position: 'absolute',
        left: spacing.md,
        zIndex: 1,
        fontWeight: typography.fontWeight.medium,
    },
    input: {
        borderWidth: 1,
        borderRadius: borderRadius.lg,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.regular,
    },
    helperText: {
        marginTop: spacing.xs,
        marginLeft: spacing.md,
        fontSize: typography.fontSize.xs,
    },
});
