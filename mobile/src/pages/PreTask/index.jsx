import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { useCurrentHabit } from '../../contexts/CurrentHabitContext';
import { getPreTaskPriming } from '../../services/api';
import { useI18n } from '../../contexts/LanguageContext';
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
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState(t('preTask.carregando'));
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
        setText(t('preTask.fraseFallback'));
      });
  }, [currentHabit]);

  if (!currentHabit) {
    return null;
  }

  return (
    <PreTaskContainer style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}>
      <BackButtonWrapper style={{ top: insets.top + 24 }}>
        <BackButton onPress={() => router.push('/home')} accessibilityLabel={t('preTask.voltarParaHome')}>
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
          <ReadyButtonText>{t('preTask.estouPronto')}</ReadyButtonText>
        </ReadyButton>
      </ActionWrapper>
    </PreTaskContainer>
  );
};

export default PreTask;
