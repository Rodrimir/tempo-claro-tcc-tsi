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

// @audit-ok [Pré-Tarefa Priming (6) — exibe texto motivacional antes do início da execução]

const PreTask = () => {
  const navigate = useNavigate();
  const [text, setText] = useState('Carregando...');
  const { currentHabit } = useCurrentHabit();

  // @audit-ok [Pré-Tarefa Priming (7) — redireciona para home se não há hábito selecionado; busca priming]
  useEffect(() => {
    if (!currentHabit) {
      navigate('/home', { replace: true });
      return;
    }
    // @audit-ok [Pré-Tarefa Priming (8) — chama GET /habits/{id}/priming]
    getPreTaskPriming(currentHabit.id)
      .then(res => {
        // @audit-ok [Pré-Tarefa Priming (16) — exibe texto retornado pela API]
        setText(`"${res.data.texto}"`);
      })
      .catch(() => {
        setText('"A excelência não é um ato, mas um hábito."');
      });
  }, [currentHabit, navigate]);

  return (
    <PreTaskContainer>
      <BackButtonWrapper>
        <BackButton onClick={() => navigate('/home')} aria-label="Voltar para a Home">
          <ArrowLeft size={32} />
        </BackButton>
      </BackButtonWrapper>

      <ContentWrapper>
        <Quote size={48} style={{ marginBottom: '24px', opacity: 0.5 }} />
        <QuoteText>{text}</QuoteText>
      </ContentWrapper>

      <ActionWrapper>
        {/* @audit-ok [Pré-Tarefa Priming (17) — navega para a execução ao confirmar prontidão] */}
        <ReadyButton onClick={() => navigate('/execute')}>
          ESTOU PRONTO
        </ReadyButton>
      </ActionWrapper>
    </PreTaskContainer>
  );
};

export default PreTask;
