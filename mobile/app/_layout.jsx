import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { View } from 'react-native';
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
import { ThemeToggleProvider } from '../src/contexts/ThemeToggleContext';
import { ToastProvider } from '../src/contexts/ToastContext';

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
    return <View style={{ flex: 1 }} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="pretask" />
      <Stack.Screen name="execute" />
      <Stack.Screen name="success" />
      <Stack.Screen name="fail" />
    </Stack>
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
    return <View style={{ flex: 1 }} />;
  }

  return (
    <AuthProvider>
      <CurrentHabitProvider>
        <ExecutionResultProvider>
          <ThemeToggleProvider>
            <ToastProvider>
              <AuthGuard />
            </ToastProvider>
          </ThemeToggleProvider>
        </ExecutionResultProvider>
      </CurrentHabitProvider>
    </AuthProvider>
  );
}
