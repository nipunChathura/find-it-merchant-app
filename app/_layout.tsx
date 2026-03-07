import { DefaultTheme as NavDefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { AuthProvider } from '@/context/auth-context';
import { OutletProvider } from '@/src/context/OutletContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

const AppTheme = {
  ...NavDefaultTheme,
  dark: false,
  colors: {
    ...NavDefaultTheme.colors,
    primary: Colors.light.tint,
    background: Colors.light.background,
    card: Colors.light.background,
    text: Colors.light.text,
    border: Colors.light.border,
    notification: Colors.light.secondary,
  },
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <OutletProvider>
          <ThemeProvider value={AppTheme}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="login" />
              <Stack.Screen name="register" />
              <Stack.Screen name="forgot-password" />
              <Stack.Screen name="reset-password" />
              <Stack.Screen name="(tabs)" />
            </Stack>
            <StatusBar style="dark" />
          </ThemeProvider>
        </OutletProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
