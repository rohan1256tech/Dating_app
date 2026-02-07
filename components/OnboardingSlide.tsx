import React from 'react';
import { Dimensions, ImageSourcePropType, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface OnboardingSlideProps {
    title: string;
    description: string;
    image: ImageSourcePropType; // Using ImageSourcePropType for local/remote images
}

export const OnboardingSlide: React.FC<OnboardingSlideProps> = ({ title, description, image }) => {
    return (
        <View style={styles.container}>
            <Animated.View entering={FadeInUp.delay(200).duration(1000)} style={styles.imageContainer}>
                {/* Placeholder for illustration - replacing with a simple view if no image provided, but typing expects image */}
                {/* In a real app, use actual images. For now, we can use a colored block or icon if image is missing, 
              but let's assume we pass a valid source or render a placeholder view */}
                <View style={styles.placeholderImage}>
                    <Text style={styles.placeholderText}>Illustration</Text>
                </View>
            </Animated.View>

            <View style={styles.textContainer}>
                <Animated.Text entering={FadeInDown.delay(400).duration(800)} style={styles.title}>
                    {title}
                </Animated.Text>
                <Animated.Text entering={FadeInDown.delay(600).duration(800)} style={styles.description}>
                    {description}
                </Animated.Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width,
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageContainer: {
        flex: 0.5,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
    },
    placeholderImage: {
        width: width * 0.8,
        height: width * 0.8,
        backgroundColor: '#F0F0F0',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        color: '#888',
        fontSize: 18,
        fontWeight: '500',
    },
    textContainer: {
        flex: 0.3,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 16,
    },
    description: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        paddingHorizontal: 20,
        lineHeight: 24,
    },
});
