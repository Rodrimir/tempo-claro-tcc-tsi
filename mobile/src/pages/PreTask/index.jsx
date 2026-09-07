import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { useCurrentHabit } from '../../contexts/CurrentHabitContext';
import { getPreTaskPriming } from '../../services/api';
import {
  PreTaskContainer,
  BackButtonWrapper,
  BackButton,
  ContentWrapper,
  HabitName,
  GatilhoText,
  QuoteText,
  ActionWrapper,
  ReadyButton,
  ReadyButtonText,
} from './styles';

const PreTask = () => {
  const router = useRouter();
  const [text, setText] = useState('Carregando...');
  const { currentHabit } = useCurrentHabit();

  useEffect(() => {
    if (!currentHabit) {
      router.replace('/home');
      return;
    }
    getPreTaskPriming(currentHabit.id)
      .then((res) => {
        setText(`"${res.data.texto}"`);
      })
      .catch(() => {
        setText('"A excelência não é um ato, mas um hábito."');
      });
  }, [currentHabit]);

  if (!currentHabit) {
    return null;
  }

  return (
    <PreTaskContainer>
      <BackButtonWrapper>
        <BackButton onPress={() => router.push('/home')} accessibilityLabel="Voltar para a Home">
          <Feather name="arrow-left" size={32} color="white" />
        </BackButton>
      </BackButtonWrapper>

      <ContentWrapper>
        <HabitName>{currentHabit?.titulo}</HabitName>
        {currentHabit?.gatilho_ancora ? <GatilhoText>⚓ {currentHabit.gatilho_ancora}</GatilhoText> : null}
        <FontAwesome5 name="quote-right" size={40} color="white" style={{ opacity: 0.5, marginBottom: 24 }} />
        <QuoteText>{text}</QuoteText>
      </ContentWrapper>

      <ActionWrapper>
        <ReadyButton onPress={() => router.push('/execute')}>
          <ReadyButtonText>ESTOU PRONTO</ReadyButtonText>
        </ReadyButton>
      </ActionWrapper>
    </PreTaskContainer>
  );
};

export default PreTask;
