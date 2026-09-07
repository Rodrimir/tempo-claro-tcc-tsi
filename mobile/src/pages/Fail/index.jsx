import { useRouter } from 'expo-router';
import { useTheme } from 'styled-components/native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useExecutionResult } from '../../contexts/ExecutionResultContext';
import { useFloat } from '../../hooks/useFloat';
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
  const theme = useTheme();
  const { executionResult } = useExecutionResult();
  const flutuando = useFloat(4000, 10);

  const type = executionResult?.type || 'FAIL_TIMEOUT';
  const feedbackMsg = executionResult?.feedback?.texto_feedback;
  const moedasGanhas = executionResult?.feedback?.moedas_ganhas || 0;

  let icon, title, subtitle, bgColor;

  if (type === 'FAIL_BLOQUEIO') {
    icon = <MaterialCommunityIcons name="shield-alert" size={80} color="white" />;
    title = 'Protegido!';
    subtitle = feedbackMsg || 'Acúmulos protegidos! Sua ofensiva foi salva pelo Escudo.';
    bgColor = theme.warningStrong;
  } else if (type === 'FAIL_TIMEOUT') {
    icon = <Feather name="clock" size={80} color="white" />;
    title = 'Tempo Esgotado';
    subtitle = feedbackMsg || 'Você demorou muito para retomar. A ofensiva foi perdida.';
    bgColor = theme.dangerStrong;
  } else {
    icon = <MaterialCommunityIcons name="heart-broken" size={80} color="white" />;
    title = 'Ofensiva Perdida';
    subtitle = feedbackMsg || 'Está tudo bem. O importante é recomeçar amanhã.';
    bgColor = theme.dangerStrong;
  }

  return (
    <FailContainer $bgColor={bgColor}>
      <ContentWrapper>
        <IconWrapper style={flutuando}>{icon}</IconWrapper>
        <Title>{title}</Title>
        <Subtitle>{subtitle}</Subtitle>
        <CoinsCard>
          <CoinsCardText>🪙 Moedas Ganhas:</CoinsCardText>
          <CoinsCardText>{moedasGanhas}</CoinsCardText>
        </CoinsCard>
        <ActionButton onPress={() => router.replace('/home')}>
          <ActionButtonText $bgColor={bgColor}>CONTINUAR</ActionButtonText>
        </ActionButton>
      </ContentWrapper>
    </FailContainer>
  );
};

export default Fail;
