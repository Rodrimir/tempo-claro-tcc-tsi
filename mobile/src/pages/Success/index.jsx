import { useEffect, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useWindowDimensions } from 'react-native';
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
  const { executionResult } = useExecutionResult();

  const feedback = executionResult?.feedback;
  const isBonus = Boolean(feedback?.bonus);
  const moedasGanhas = feedback?.moedas_ganhas ?? 0;
  const diasSeguidos = feedback?.dias_seguidos || 1;
  const subtitleText = feedback?.texto_feedback || 'A excelência é um hábito.';

  const particles = useMemo(() => {
    return Array.from({ length: 50 }).map(() => ({
      size: Math.random() * 10 + 5,
      left: Math.random() * 100,
      duration: (Math.random() * 300) / 100 + 2,
      delay: (Math.random() * 200) / 100,
    }));
  }, []);

  return (
    <SuccessContainer $isBonus={isBonus}>
      <ParticlesWrapper>
        {particles.map((p, i) => (
          <Particle key={i} size={p.size} left={p.left} duration={p.duration} delay={p.delay} />
        ))}
      </ParticlesWrapper>

      <ContentWrapper>
        <IconWrapper entering={ZoomIn.duration(500)}>{isBonus ? '🌟' : '✨'}</IconWrapper>
        <Title>{isBonus ? 'Incrível!' : 'Tarefa Concluída!'}</Title>
        <Subtitle>{subtitleText}</Subtitle>

        <RewardCard>
          <Row>
            <Label>Recompensa</Label>
            <Value>
              <FontAwesome5 name="coins" size={22} color="white" />
              <ValueText>+{moedasGanhas}</ValueText>
            </Value>
          </Row>
          <Divider />
          <Row>
            <Label>Ofensiva Atual</Label>
            <Value>
              <MaterialCommunityIcons name="fire" size={28} color="white" />
              <ValueText>{diasSeguidos} dias</ValueText>
            </Value>
          </Row>
        </RewardCard>

        <BackButton onPress={() => router.replace('/home')}>
          <BackButtonText $isBonus={isBonus}>VOLTAR PARA A HOME</BackButtonText>
        </BackButton>
      </ContentWrapper>
    </SuccessContainer>
  );
};

export default Success;
