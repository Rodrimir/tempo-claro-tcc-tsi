import { useEffect, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import * as Notifications from 'expo-notifications';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from 'styled-components/native';
import {
  useFonts,
  Lexend_400Regular,
  Lexend_600SemiBold,
  Lexend_700Bold,
  Lexend_800ExtraBold,
} from '@expo-google-fonts/lexend';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { CurrentHabitProvider } from '@/contexts/CurrentHabitContext';
import { ExecutionResultProvider } from '@/contexts/ExecutionResultContext';
import { ThemeToggleProvider, useThemeToggle } from '@/contexts/ThemeToggleContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { SoundProvider, useSfx } from '@/contexts/SoundContext';
import { OnboardingProvider, useOnboarding } from '@/onboarding/OnboardingContext';
import { FASES } from '@/onboarding/passos';
import SpotlightOverlay from '@/onboarding/SpotlightOverlay';
import { lightTheme, darkTheme } from '@/styles/theme';
import LoadingScreen from '@/components/common/LoadingScreen';
import { acordarServidor } from '@/services/api';
import { habitoDaNotificacao } from '@/services/notificacoes';

SplashScreen.preventAutoHideAsync();
acordarServidor();

const ROTAS_PUBLICAS = ['login', 'verify-email', 'forgot-password'];

// Som ligado ou desligado acompanha a preferência guardada no servidor, como tema e idioma: ao entrar
// em outro aparelho, a escolha volta junto com a conta.
function SincronizarPreferencias() {
  const { user } = useAuth();
  const { setMudo } = useSfx();
  const somDoServidor = user?.som_ativo;
  const somAplicado = useRef(undefined);

  useEffect(() => {
    if (typeof somDoServidor !== 'boolean' || somAplicado.current === somDoServidor) return;
    somAplicado.current = somDoServidor;
    setMudo(!somDoServidor);
  }, [somDoServidor, setMudo]);

  return null;
}

// Rotas liberadas durante o tour do guia: a tela inicial (onde o tour acontece) e a criação do
// primeiro hábito, com a calibração, que é o último passo.
const ROTAS_DO_TOUR = ['(tabs)', 'create', 'calibration'];

function AuthGuard() {
  const { isAuthenticated, loading } = useAuth();
  const { ativo: guiaAtivo, fase } = useOnboarding();
  const router = useRouter();
  const segments = useSegments();
  const ultimaRespostaDeNotificacao = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (loading) return;
    const emRotaPublica = ROTAS_PUBLICAS.includes(segments[0]);
    if (!isAuthenticated && !emRotaPublica) {
      router.replace('/login');
      return;
    }
    // O guia de primeiro acesso é obrigatório: até ser concluído, toda abertura do app passa por ele.
    if (isAuthenticated && guiaAtivo) {
      const noGuia = segments[0] === 'onboarding';
      const liberadaNoTour = fase === FASES.TOUR && ROTAS_DO_TOUR.includes(segments[0]);
      if (!noGuia && !liberadaNoTour) router.replace('/onboarding');
    }
  }, [loading, isAuthenticated, guiaAtivo, fase, segments, router]);

  // Tocar num lembrete abre a tela inicial já no hábito do aviso, com o app aberto ou fechado.
  useEffect(() => {
    if (loading || !isAuthenticated || !ultimaRespostaDeNotificacao) return;
    if (ultimaRespostaDeNotificacao.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const habitoId = habitoDaNotificacao(ultimaRespostaDeNotificacao);
    Notifications.clearLastNotificationResponse();
    if (habitoId) {
      router.replace({ pathname: '/home', params: { habitoId } });
    }
  }, [loading, isAuthenticated, ultimaRespostaDeNotificacao, router]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <View style={{ flex: 1 }}>
    <SincronizarPreferencias />
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="verify-email" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="change-password" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="create" />
      <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
      <Stack.Screen name="pretask" />
      <Stack.Screen name="execute" />
      <Stack.Screen name="success" />
      <Stack.Screen name="fail" />
      <Stack.Screen name="calibration" />
    </Stack>
    <SpotlightOverlay />
    </View>
  );
}

function ThemedApp() {
  const { isDark } = useThemeToggle();
  return (
    <ThemeProvider theme={isDark ? darkTheme : lightTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ToastProvider>
        <OnboardingProvider>
          <AuthGuard />
        </OnboardingProvider>
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
      <SoundProvider>
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
      </SoundProvider>
    </SafeAreaProvider>
  );
}
