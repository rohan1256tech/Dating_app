import { borderRadius, colors, elevation, spacing, Theme, typography } from '@/constants/design-tokens';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    colors: typeof colors;
    typography: typeof typography;
    spacing: typeof spacing;
    borderRadius: typeof borderRadius;
    elevation: typeof elevation;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const systemColorScheme = useColorScheme();
    const [theme, setTheme] = useState<Theme>(systemColorScheme || 'light');

    useEffect(() => {
        if (systemColorScheme) {
            setTheme(systemColorScheme);
        }
    }, [systemColorScheme]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
    };

    const isDark = theme === 'dark';

    const value: ThemeContextType = {
        theme,
        toggleTheme,
        colors,
        typography,
        spacing,
        borderRadius,
        elevation,
        isDark,
    };

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};

// Helper hook for theme-aware colors
export const useThemedColors = () => {
    const { isDark, colors } = useTheme();

    return {
        background: isDark ? colors.background.dark : colors.background.light,
        surface: isDark ? colors.surface.dark : colors.surface.light,
        text: isDark ? colors.text.primary.dark : colors.text.primary.light,
        textSecondary: isDark ? colors.text.secondary.dark : colors.text.secondary.light,
        textDisabled: isDark ? colors.text.disabled.dark : colors.text.disabled.light,
        border: isDark ? colors.border.dark : colors.border.light,
        overlay: isDark ? colors.overlay.dark : colors.overlay.light,
        primary: colors.primary[500],
        success: colors.success.main,
        error: colors.error.main,
        warning: colors.warning.main,
        info: colors.info.main,
        accent: colors.accent.main,
    };
};
