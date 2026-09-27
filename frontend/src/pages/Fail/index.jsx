import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { BackHandler } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'styled-components/native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useExecutionResult } from '@/contexts/ExecutionResultContext';
import { useI18n } from '@/contexts/LanguageContext';
import { useSfx } from '@/contexts/SoundContext';
import { useFloat } from '@/hooks/useFloat';
import {
  FailContainer,
  ContentWrapper,
  IconWrapper,
  Title,
  Subtitle,
  CoinsCard,
  CoinsCardText,
  ActionButton,
  ActionButtonText,
} from './styles';

const Fail = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const { executionResult } = useExecutionResult();
  const { t } = useI18n();
  const { tocar } = useSfx();
  const flutuando = useFloat(4000, 10);

  const type = executionResult?.type || 'FAIL_TIMEOUT';
  const feedbackMsg = executionResult?.feedback?.texto_feedback;
  const moedasTotais = executionResult?.feedback?.moedas_totais || 0;

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      router.replace('/home');
      return true;
    });
    return () => subscription.remove();
  }, [router]);

  useEffect(() => {
    tocar('fail');
  }, [tocar]);

  let icon, title, subtitle, bgColor;

  if (type === 'FAIL_BLOQUEIO') {
    icon = <MaterialCommunityIcons name="shield-alert" size={80} color="white" />;
    title = t('falha.protegido');
    subtitle = feedbackMsg || t('falha.protegidoTexto');
    bgColor = theme.warningStrong;
  } else if (type === 'FAIL_TIMEOUT') {
    icon = <Feather name="clock" size={80} color="white" />;
    title = t('falha.tempoEsgotado');
    subtitle = feedbackMsg || t('falha.tempoEsgotadoTexto');
    bgColor = theme.dangerStrong;
  } else {
    icon = <MaterialCommunityIcons name="heart-broken" size={80} color="white" />;
    title = t('falha.ofensivaPerdida');
    subtitle = feedbackMsg || t('falha.ofensivaPerdidaTexto');
    bgColor = theme.dangerStrong;
  }

  return (
    <FailContainer $bgColor={bgColor} style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}>
      <ContentWrapper>
        <IconWrapper style={flutuando}>{icon}</IconWrapper>
        <Title>{title}</Title>
        <Subtitle>{subtitle}</Subtitle>
        <CoinsCard>
          <CoinsCardText>{t('falha.suasMoedas')}</CoinsCardText>
          <CoinsCardText>{moedasTotais}</CoinsCardText>
        </CoinsCard>
        <ActionButton onPress={() => router.replace('/home')}>
          <ActionButtonText $bgColor={bgColor}>{t('comum.continuar').toUpperCase()}</ActionButtonText>
        </ActionButton>
      </ContentWrapper>
    </FailContainer>
  );
};

export default Fail;
