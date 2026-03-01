// Design Tokens - Premium Dating App
// Inspired by Tinder, Bumble, Hinge color schemes

export const colors = {
    // Primary - Passionate Red/Pink (Dating app signature)
    primary: {
        50: '#FFF1F2',
        100: '#FFE4E6',
        200: '#FECDD3',
        300: '#FDA4AF',
        400: '#FB7185',
        500: '#FF6B6B', // Main brand color
        600: '#E11D48',
        700: '#BE123C',
        800: '#9F1239',
        900: '#881337',
    },

    // Neutral - Clean grays
    neutral: {
        50: '#FAFAFA',
        100: '#F5F5F5',
        200: '#E5E5E5',
        300: '#D4D4D4',
        400: '#A3A3A3',
        500: '#737373',
        600: '#525252',
        700: '#404040',
        800: '#262626',
        900: '#171717',
    },

    // Success - Match/Like actions
    success: {
        light: '#86EFAC',
        main: '#22C55E',
        dark: '#15803D',
    },

    // Error - Nope/Warning actions
    error: {
        light: '#FCA5A5',
        main: '#EF4444',
        dark: '#B91C1C',
    },

    // Warning
    warning: {
        light: '#FCD34D',
        main: '#F59E0B',
        dark: '#D97706',
    },

    // Info
    info: {
        light: '#93C5FD',
        main: '#3B82F6',
        dark: '#1D4ED8',
    },

    // Accent - Gold for premium features
    accent: {
        light: '#FDE68A',
        main: '#FFD700',
        dark: '#CA8A04',
    },

    // Semantic colors
    background: {
        light: '#FFFFFF',
        dark: '#0F0F0F',
    },
    surface: {
        light: '#F9FAFB',
        dark: '#1A1A1A',
    },
    text: {
        primary: {
            light: '#171717',
            dark: '#FAFAFA',
        },
        secondary: {
            light: '#525252',
            dark: '#A3A3A3',
        },
        disabled: {
            light: '#D4D4D4',
            dark: '#404040',
        },
    },
    border: {
        light: '#E5E5E5',
        dark: '#262626',
    },
    overlay: {
        light: 'rgba(0, 0, 0, 0.5)',
        dark: 'rgba(0, 0, 0, 0.7)',
    },
};

export const typography = {
    // Font families
    fontFamily: {
        regular: 'System',
        medium: 'System',
        semibold: 'System',
        bold: 'System',
    },

    // Font sizes
    fontSize: {
        xs: 12,
        sm: 14,
        base: 16,
        lg: 18,
        xl: 20,
        '2xl': 24,
        '3xl': 30,
        '4xl': 36,
        '5xl': 48,
    },

    // Line heights
    lineHeight: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.75,
    },

    // Font weights
    fontWeight: {
        regular: '400' as const,
        medium: '500' as const,
        semibold: '600' as const,
        bold: '700' as const,
    },
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
    '4xl': 96,
};

export const borderRadius = {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 24,
    full: 9999,
};

export const elevation = {
    none: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
    },
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
    },
    xl: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 16,
    },
};

export const transitions = {
    fast: 150,
    normal: 250,
    slow: 350,
};

export type Theme = 'light' | 'dark';
