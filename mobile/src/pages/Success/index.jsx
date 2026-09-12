import { useEffect, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { BackHandler, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  ZoomIn,
} from 'react-native-reanimated';
import { useExecutionResult } from '../../contexts/ExecutionResultContext';
import { useI18n } from '../../contexts/LanguageContext';
import {
  SuccessContainer,
  ParticlesWrapper,
  ParticleView,
  ContentWrapper,
  IconWrapper,
  Title,
  Subtitle,
  RewardCard,
  Row,
  Label,
  Value,
  ValueText,
  Divider,
  RewardNote,
  BackButton,
  BackButtonText,
} from './styles';

function Particle({ size, left, duration, delay }) {
  const { height } = useWindowDimensions();
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const durMs = duration * 1000;
    const delayMs = delay * 1000;
    translateY.value = withDelay(delayMs, withRepeat(withTiming(-height, { duration: durMs, easing: Easing.linear }), -1));
    scale.value = withDelay(delayMs, withRepeat(withTiming(0.5, { duration: durMs, easing: Easing.linear }), -1));
    opacity.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(
          withTiming(1, { duration: durMs * 0.2, easing: Easing.linear }),
          withTiming(0, { duration: durMs * 0.8, easing: Easing.linear })
        ),
        -1
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const estilo = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  return <ParticleView style={[{ width: size, height: size, left: `${left}%` }, estilo]} />;
}

const Success = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { executionResult } = useExecutionResult();
  const { t } = useI18n();

  const feedback = executionResult?.feedback;
  const isBonus = Boolean(feedback?.bonus);
  // A execução não credita mais moedas: o crédito é do dia inteiro e acontece no
  // fechamento (RF11/RF12). O que vem aqui é a PREVISÃO do que o dia renderá se
  // fechar como está agora — por isso o rótulo diz "a receber", não "recompensa".
  const moedasPrevistas = feedback?.moedas_previstas_hoje ?? 0;
  const acumuladoHoje = feedback?.valor_acumulado_hoje ?? 0;
  const metaDoDia = feedback?.meta_base ?? 0;
  const diasSeguidos = feedback?.dias_seguidos ?? 0;
  const metaBatida = metaDoDia > 0 && acumuladoHoje >= metaDoDia;
  // texto_feedback vem da biblioteca do servidor, já no idioma do usuário.
  const subtitleText = feedback?.texto_feedback || t('sucesso.subtituloPadrao');

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      router.replace('/home');
      return true;
    });
    return () => subscription.remove();
  }, [router]);

  const particles = useMemo(() => {
    return Array.from({ length: 50 }).map(() => ({
      size: Math.random() * 10 + 5,
      left: Math.random() * 100,
      duration: (Math.random() * 300) / 100 + 2,
      delay: (Math.random() * 200) / 100,
    }));
  }, []);

  return (
    <SuccessContainer $isBonus={isBonus} style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}>
      <ParticlesWrapper>
        {particles.map((p, i) => (
          <Particle key={i} size={p.size} left={p.left} duration={p.duration} delay={p.delay} />
        ))}
      </ParticlesWrapper>

      <ContentWrapper>
        <IconWrapper entering={ZoomIn.duration(500)}>{isBonus ? '🌟' : '✨'}</IconWrapper>
        <Title>{isBonus ? t('sucesso.tituloBonus') : t('sucesso.tituloPadrao')}</Title>
        <Subtitle>{subtitleText}</Subtitle>

        <RewardCard>
          <Row>
            <Label>{t('sucesso.aReceber')}</Label>
            <Value>
              <FontAwesome5 name="coins" size={22} color="white" />
              <ValueText>{moedasPrevistas}</ValueText>
            </Value>
          </Row>
          <RewardNote>
            {metaBatida
              ? t('sucesso.notaMetaBatida')
              : t('sucesso.notaEmAndamento')}
          </RewardNote>
          <Divider />
          {metaDoDia > 0 ? (
            <>
              <Row>
                <Label>{t('sucesso.progressoHoje')}</Label>
                <Value>
                  <MaterialCommunityIcons
                    name={metaBatida ? 'check-circle' : 'progress-clock'}
                    size={24}
                    color="white"
                  />
                  <ValueText>
                    {acumuladoHoje}/{metaDoDia}
                  </ValueText>
                </Value>
              </Row>
              <Divider />
            </>
          ) : null}
          <Row>
            <Label>{t('sucesso.ofensiva')}</Label>
            <Value>
              <MaterialCommunityIcons name="fire" size={28} color="white" />
              <ValueText>{diasSeguidos} {t('comum.dias')}</ValueText>
            </Value>
          </Row>
        </RewardCard>

        <BackButton onPress={() => router.replace('/home')}>
          <BackButtonText $isBonus={isBonus}>{t('sucesso.voltar')}</BackButtonText>
        </BackButton>
      </ContentWrapper>
    </SuccessContainer>
  );
};

export default Success;
