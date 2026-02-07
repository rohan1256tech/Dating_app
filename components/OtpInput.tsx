import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

interface OtpInputProps {
    length?: number;
    value: string;
    onCodeChanged: (code: string) => void;
}

export const OtpInput: React.FC<OtpInputProps> = ({ length = 6, value, onCodeChanged }) => {
    const inputRefs = useRef<Array<TextInput | null>>([]);
    const [focusedIndex, setFocusedIndex] = useState<number | null>(0);

    // Initialize refs array
    useEffect(() => {
        inputRefs.current = inputRefs.current.slice(0, length);
    }, [length]);

    const handleChangeText = (text: string, index: number) => {
        const newValue = value.split('');

        // Handle paste or multiple chars
        if (text.length > 1) {
            const pastedChars = text.slice(0, length - index).split('');
            for (let i = 0; i < pastedChars.length; i++) {
                newValue[index + i] = pastedChars[i];
            }
            onCodeChanged(newValue.join(''));
            const nextIndex = Math.min(index + pastedChars.length, length - 1);
            inputRefs.current[nextIndex]?.focus();
            return;
        }

        // Handle single char
        if (text) {
            newValue[index] = text;
            onCodeChanged(newValue.join(''));
            if (index < length - 1) {
                inputRefs.current[index + 1]?.focus();
            }
        } else {
            // Handle deletion (empty text handled in onKeyPress usually, but safety here)
            newValue[index] = '';
            onCodeChanged(newValue.join(''));
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace') {
            if (value[index]) {
                const newValue = value.split('');
                newValue[index] = '';
                onCodeChanged(newValue.join(''));
            } else {
                if (index > 0) {
                    inputRefs.current[index - 1]?.focus();
                    const newValue = value.split('');
                    newValue[index - 1] = '';
                    onCodeChanged(newValue.join(''));
                }
            }
        }
    };

    return (
        <View style={styles.container}>
            {Array(length).fill(0).map((_, index) => (
                <TextInput
                    key={index}
                    ref={(ref) => { inputRefs.current[index] = ref; }}
                    style={[
                        styles.input,
                        focusedIndex === index && styles.inputFocused,
                        !!value[index] && styles.inputFilled,
                    ]}
                    value={value[index] || ''}
                    onChangeText={(text) => handleChangeText(text, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    onFocus={() => setFocusedIndex(index)}
                    onBlur={() => setFocusedIndex(null)}
                    keyboardType="number-pad"
                    maxLength={index === length - 1 ? 1 : 6} // Allow paste in last input? No, simplified.
                    selectTextOnFocus
                    // iOS OTP Auto-fill props
                    textContentType="oneTimeCode"
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 30,
    },
    input: {
        width: 45,
        height: 55,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        backgroundColor: '#FAFAFA',
        textAlign: 'center',
        fontSize: 22,
        fontWeight: '600',
        color: '#333',
    },
    inputFocused: {
        borderColor: '#FF6B6B',
        backgroundColor: '#FFF0F0',
    },
    inputFilled: {
        borderColor: '#333',
        backgroundColor: '#fff',
    },
});
