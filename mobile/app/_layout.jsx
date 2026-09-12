import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from 'styled-components/native';
import {
  useFonts,
  Lexend_400Regular,
  Lexend_600SemiBold,
  Lexend_700Bold,
  Lexend_800ExtraBold,
} from '@expo-google-fonts/lexend';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { CurrentHabitProvider } from '../src/contexts/CurrentHabitContext';
import { ExecutionResultProvider } from '../src/contexts/ExecutionResultContext';
import { ThemeToggleProvider, useThemeToggle } from '../src/contexts/ThemeToggleContext';
import { ToastProvider } from '../src/contexts/ToastContext';
import { LanguageProvider } from '../src/contexts/LanguageContext';
import { lightTheme, darkTheme } from '../src/styles/theme';
import LoadingScreen from '../src/components/common/LoadingScreen';

SplashScreen.preventAutoHideAsync();

function AuthGuard() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;
    const noGrupoLogin = segments[0] === 'login';
    if (!isAuthenticated && !noGrupoLogin) {
      router.replace('/login');
    }
  }, [loading, isAuthenticated, segments]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="pretask" />
      <Stack.Screen name="execute" />
      <Stack.Screen name="success" />
      <Stack.Screen name="fail" />
      <Stack.Screen name="calibration" />
    </Stack>
  );
}

function ThemedApp() {
  const { isDark } = useThemeToggle();
  return (
    <ThemeProvider theme={isDark ? darkTheme : lightTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ToastProvider>
        <AuthGuard />
      </ToastProvider>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Lexend_400Regular,
    Lexend_600SemiBold,
    Lexend_700Bold,
    Lexend_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: lightTheme.bgPrimary }} />;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CurrentHabitProvider>
          <ExecutionResultProvider>
            <LanguageProvider>
              <ThemeToggleProvider>
                <ThemedApp />
              </ThemeToggleProvider>
            </LanguageProvider>
          </ExecutionResultProvider>
        </CurrentHabitProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
