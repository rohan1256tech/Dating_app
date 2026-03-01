import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AppProvider } from '@/context/AppContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemeProvider } from '@/theme/ThemeProvider';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider>
      <AppProvider>
        <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="index" options={{ title: 'Home', headerShown: false }} />
            <Stack.Screen name="onboarding/index" options={{ title: 'Onboarding', headerShown: false, animation: 'fade' }} />
            <Stack.Screen name="login/index" options={{ title: 'Login', headerShown: false }} />
            <Stack.Screen name="otp-verification/index" options={{ title: 'OTP', headerShown: false }} />
            <Stack.Screen name="profile-setup/basic-info/index" options={{ title: 'Basic Info', headerShown: false }} />
            <Stack.Screen name="profile-setup/photos/index" options={{ title: 'Photos', headerShown: false }} />
            <Stack.Screen name="profile-setup/interests/index" options={{ title: 'Interests', headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="chat/[id]" options={{ title: 'Chat' }} />
          </Stack>
          <StatusBar style="auto" />
        </NavigationThemeProvider>
      </AppProvider>
    </ThemeProvider>
  );
}
