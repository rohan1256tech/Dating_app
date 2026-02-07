import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    loading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    loading = false,
    disabled = false,
    style,
    textStyle,
}) => {
    const getBackgroundColor = () => {
        if (disabled) return '#E0E0E0';
        switch (variant) {
            case 'primary':
                return '#FF6B6B';
            case 'secondary':
                return '#FFF0F0';
            case 'outline':
                return 'transparent';
            case 'ghost':
                return 'transparent';
            default:
                return '#FF6B6B';
        }
    };

    const getTextColor = () => {
        if (disabled) return '#A0A0A0';
        switch (variant) {
            case 'primary':
                return '#FFFFFF';
            case 'secondary':
                return '#FF6B6B';
            case 'outline':
                return '#FF6B6B';
            case 'ghost':
                return '#666';
            default:
                return '#FFFFFF';
        }
    };

    const getBorderColor = () => {
        if (variant === 'outline') return '#FF6B6B';
        return 'transparent';
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            style={[
                styles.container,
                {
                    backgroundColor: getBackgroundColor(),
                    borderColor: getBorderColor(),
                    borderWidth: variant === 'outline' ? 1.5 : 0,
                },
                style,
            ]}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator color={getTextColor()} />
            ) : (
                <Text style={[styles.text, { color: getTextColor() }, textStyle]}>{title}</Text>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        width: '100%',
    },
    text: {
        fontSize: 16,
        fontWeight: '600',
    },
});
