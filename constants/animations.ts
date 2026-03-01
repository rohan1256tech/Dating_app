// Animation Constants
// Shared animation configurations for Reanimated 3

import { Easing } from 'react-native-reanimated';

export const springConfig = {
    // Gentle bounce - For cards, modals
    gentle: {
        damping: 20,
        stiffness: 150,
        mass: 1,
    },

    // Snappy - For buttons, quick interactions
    snappy: {
        damping: 15,
        stiffness: 200,
        mass: 0.5,
    },

    // Smooth - For page transitions
    smooth: {
        damping: 25,
        stiffness: 120,
        mass: 1,
    },

    // Bouncy - For celebrations, success states
    bouncy: {
        damping: 10,
        stiffness: 100,
        mass: 1,
    },
};

export const timingConfig = {
    // Fast - Quick feedback (150ms)
    fast: {
        duration: 150,
        easing: Easing.out(Easing.quad),
    },

    // Normal - Standard animations (250ms)
    normal: {
        duration: 250,
        easing: Easing.inOut(Easing.ease),
    },

    // Slow - Detailed animations (350ms)
    slow: {
        duration: 350,
        easing: Easing.out(Easing.cubic),
    },

    // Linear - For progress bars
    linear: {
        duration: 300,
        easing: Easing.linear,
    },
};

// Swipe gesture physics
export const swipeConfig = {
    velocityThreshold: 500,
    rotationFactor: 0.1,
    snapPoint: 0.3, // 30% of screen width
};

// Press feedback
export const pressConfig = {
    scaleDown: 0.95,
    opacity: 0.6,
    duration: 100,
};

// Page transition configs
export const pageTransition = {
    duration: 300,
    easing: Easing.out(Easing.cubic),
};
