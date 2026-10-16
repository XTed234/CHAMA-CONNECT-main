import 'react-native-reanimated';
import React, { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SystemBars } from 'react-native-edge-to-edge';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import {
  DarkTheme,
  DefaultTheme,
  Theme,
  ThemeProvider,
} from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AuthProvider } from '@/contexts/AuthContext';
import { ChamaProvider } from '@/contexts/ChamaContext';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DevErrorBoundary: React.ComponentType<{ children: React.ReactNode }> = (
  typeof __DEV__ !== 'undefined' && __DEV__
    ? ErrorBoundary
    : ({ children }: { children: React.ReactNode }) => <>{children}</>
) as React.ComponentType<{ children: React.ReactNode }>;

SplashScreen.preventAutoHideAsync();

const ChamaDefaultTheme: Theme = {
  ...DefaultTheme,
  dark: false,
  colors: {
    primary: '#1A56DB',
    background: '#F4F7FC',
    card: '#FFFFFF',
    text: '#0F172A',
    border: 'rgba(26,86,219,0.12)',
    notification: '#EF4444',
  },
};

const ChamaDarkTheme: Theme = {
  ...DarkTheme,
  colors: {
    primary: '#3E8EDE',
    background: '#0B1528',
    card: '#13233F',
    text: '#F1F5F9',
    border: 'rgba(62,142,222,0.18)',
    notification: '#EF4444',
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  return (
    <DevErrorBoundary>
      <StatusBar style="auto" animated />
      <ThemeProvider value={colorScheme === 'dark' ? ChamaDarkTheme : ChamaDefaultTheme}>
        <SafeAreaProvider>
          <AuthProvider>
            <ChamaProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <Stack>
                  <Stack.Screen name="index" options={{ headerShown: false }} />
                  <Stack.Screen name="intro" options={{ headerShown: false }} />
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="auth" options={{ headerShown: false }} />
                  <Stack.Screen name="chama" options={{ headerShown: false }} />
                  <Stack.Screen name="member" options={{ headerShown: false }} />
                  <Stack.Screen name="contribution" options={{ headerShown: false }} />
                  <Stack.Screen name="fine" options={{ headerShown: false }} />
                </Stack>
                <SystemBars style="auto" />
              </GestureHandlerRootView>
            </ChamaProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </ThemeProvider>
    </DevErrorBoundary>
  );
}
