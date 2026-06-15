import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Quote, ArrowLeft } from 'lucide-react';
import { useCurrentHabit } from '../../contexts/CurrentHabitContext';
import { getPreTaskPriming } from '../../services/api';
import {
  PreTaskContainer,
  BackButtonWrapper,
  BackButton,
  ContentWrapper,
  QuoteText,
  ActionWrapper,
  ReadyButton
} from './styles';

const PreTask = () => {
  const navigate = useNavigate();
  const [text, setText] = useState('Carregando...');
  const { currentHabit } = useCurrentHabit();

  useEffect(() => {
    if (currentHabit) {
      getPreTaskPriming(currentHabit.id)
        .then(res => {
          setText(`"${res.data.texto}"`);
        })
        .catch(err => {
          setText('"A excelência não é um ato, mas um hábito."');
        });
    }
  }, [currentHabit]);

  return (
    <PreTaskContainer>
      <BackButtonWrapper>
        <BackButton onClick={() => navigate('/home')} aria-label="Voltar para a Home">
          <ArrowLeft size={32} />
        </BackButton>
      </BackButtonWrapper>

      <ContentWrapper>
        <Quote size={48} style={{ marginBottom: '24px', opacity: 0.5 }} />
        <QuoteText>
          {text}
        </QuoteText>
      </ContentWrapper>

      <ActionWrapper>
        <ReadyButton onClick={() => navigate('/execute')}>
          ESTOU PRONTO
        </ReadyButton>
      </ActionWrapper>
    </PreTaskContainer>
  );
};

export default PreTask;
