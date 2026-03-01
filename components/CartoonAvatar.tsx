import React from 'react';
import { StyleSheet, View } from 'react-native';

interface CartoonAvatarProps {
    gender?: 'male' | 'female' | 'other';
    name?: string;
    size?: number;
}

/**
 * Cartoon avatar component for map markers
 * Generates a unique cartoon-style avatar based on user characteristics
 */
export const CartoonAvatar: React.FC<CartoonAvatarProps> = ({
    gender = 'male',
    name = '',
    size = 50
}) => {
    // Generate unique colors based on name
    const getColorFromName = (str: string): string => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = hash % 360;
        return `hsl(${hue}, 70%, 60%)`;
    };

    const primaryColor = name ? getColorFromName(name) : '#FF6B6B';
    const secondaryColor = name ? getColorFromName(name + 'alt') : '#4ECDC4';

    // Different avatar styles based on gender
    const getAvatarStyle = () => {
        const baseStyle = {
            width: size,
            height: size,
            borderRadius: size / 2,
            overflow: 'hidden' as const,
            borderWidth: 3,
            borderColor: '#fff',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 5,
        };

        return baseStyle;
    };

    return (
        <View style={getAvatarStyle()}>
            <View style={[styles.avatarBackground, { backgroundColor: primaryColor }]}>
                {/* Simple geometric face */}
                <View style={styles.face}>
                    {/* Eyes */}
                    <View style={styles.eyesContainer}>
                        <View style={[styles.eye, { backgroundColor: '#fff' }]}>
                            <View style={styles.pupil} />
                        </View>
                        <View style={[styles.eye, { backgroundColor: '#fff' }]}>
                            <View style={styles.pupil} />
                        </View>
                    </View>

                    {/* Smile */}
                    <View style={[styles.mouth, { borderColor: secondaryColor }]} />
                </View>

                {/* Hair/accessory indicator */}
                <View style={[styles.hair, { backgroundColor: secondaryColor }]} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    avatarBackground: {
        width: '100%',
        height: '100%',
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    face: {
        position: 'absolute',
        bottom: '20%',
    },
    eyesContainer: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 6,
    },
    eye: {
        width: 8,
        height: 8,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pupil: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#333',
    },
    mouth: {
        width: 16,
        height: 8,
        borderBottomWidth: 2,
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
        alignSelf: 'center',
    },
    hair: {
        position: 'absolute',
        top: '10%',
        width: '70%',
        height: '30%',
        borderTopLeftRadius: 100,
        borderTopRightRadius: 100,
    },
});
