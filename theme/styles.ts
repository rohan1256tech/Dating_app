import { borderRadius, colors, elevation, spacing, typography } from '@/constants/design-tokens';
import { StyleSheet } from 'react-native';

// Flex utilities
export const flex = {
    row: {
        flexDirection: 'row' as const,
    },
    rowCenter: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
    },
    rowBetween: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        justifyContent: 'space-between' as const,
    },
    column: {
        flexDirection: 'column' as const,
    },
    columnCenter: {
        flexDirection: 'column' as const,
        alignItems: 'center' as const,
    },
    center: {
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
    },
    flex1: {
        flex: 1,
    },
};

// Text styles
export const textStyles = {
    h1: {
        fontSize: typography.fontSize['4xl'],
        fontWeight: typography.fontWeight.bold,
        lineHeight: typography.fontSize['4xl'] * typography.lineHeight.tight,
    },
    h2: {
        fontSize: typography.fontSize['3xl'],
        fontWeight: typography.fontWeight.bold,
        lineHeight: typography.fontSize['3xl'] * typography.lineHeight.tight,
    },
    h3: {
        fontSize: typography.fontSize['2xl'],
        fontWeight: typography.fontWeight.semibold,
        lineHeight: typography.fontSize['2xl'] * typography.lineHeight.normal,
    },
    h4: {
        fontSize: typography.fontSize.xl,
        fontWeight: typography.fontWeight.semibold,
        lineHeight: typography.fontSize.xl * typography.lineHeight.normal,
    },
    body1: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.regular,
        lineHeight: typography.fontSize.base * typography.lineHeight.normal,
    },
    body2: {
        fontSize: typography.fontSize.sm,
        fontWeight: typography.fontWeight.regular,
        lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
    },
    caption: {
        fontSize: typography.fontSize.xs,
        fontWeight: typography.fontWeight.regular,
        lineHeight: typography.fontSize.xs * typography.lineHeight.normal,
    },
    button: {
        fontSize: typography.fontSize.base,
        fontWeight: typography.fontWeight.semibold,
        lineHeight: typography.fontSize.base * typography.lineHeight.tight,
    },
};

// Common styles
export const commonStyles = StyleSheet.create({
    container: {
        flex: 1,
    },
    containerPadded: {
        flex: 1,
        padding: spacing.md,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        ...elevation.md,
    },
    divider: {
        height: 1,
        backgroundColor: colors.neutral[200],
        marginVertical: spacing.md,
    },
    absoluteFill: {
        ...StyleSheet.absoluteFillObject,
    },
});

// Spacing helpers
export const getSpacing = (...multipliers: number[]) => {
    return multipliers.map((m) => spacing.md * m);
};
