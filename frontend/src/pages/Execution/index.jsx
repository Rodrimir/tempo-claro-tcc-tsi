// @audit-ok: FRONTEND-index.jsx-01
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTimer } from '../../hooks/useTimer';
import { submitExecution } from '../../services/api';
import { useCurrentHabit } from '../../contexts/CurrentHabitContext';
import CircularProgress from '../../components/common/CircularProgress';
import MonospaceTimer from '../../components/common/MonospaceTimer';
import GiveUpModal from '../../components/common/GiveUpModal';
import PwaPauseModal from '../../components/common/PwaPauseModal';
import {
  ExecutionContainer,
  HeaderWrapper,
  HeaderLabel,
  HeaderTitle,
  ContentWrapper,
  ControlsWrapper,
  SubButton,
  AddButton,
  ActionsWrapper,
  CompleteButtonWrapper,
  CompleteButton,
  GiveUpButton
} from './styles';

const ExecutionScreen = () => {
  const navigate = useNavigate();
  const { currentHabit } = useCurrentHabit();
  const [executionToken, setExecutionToken] = useState('');
  const [showGiveUpModal, setShowGiveUpModal] = useState(false);
  const [showPwaModal, setShowPwaModal] = useState(false);
  const [quantity, setQuantity] = useState(0);

  useEffect(() => {
    const token = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
    setExecutionToken(token);
  }, []);

  const habit = currentHabit || {
    id: 1,
    titulo: 'Modo Anônimo',
    tipo_medida: 'TEMPO',
    meta_base: 1500,
    bloqueios_acumulados: 0
  };

  const { 
    timeLeft, 
    overachieveTime, 
    isOverachieving, 
    pause, 
    resume, 
    clearTimerState 
  } = useTimer(
    habit.tipo_medida === 'TEMPO' ? habit.meta_base : 0, 
    habit.id, 
    executionToken,
    habit.tipo_medida === 'TEMPO' 
  );

  const isQuantityDone = quantity >= habit.meta_base;

  const handleComplete = async () => {
    try {
      pause(); 
      const isExtra = habit.tipo_medida === 'TEMPO' 
        ? isOverachieving && overachieveTime >= (habit.meta_base * 0.2)
        : quantity >= (habit.meta_base * 1.2);

      const payload = {
        execution_token: executionToken,
        tipo: isExtra ? 'COMPLETE_EXTRA' : 'COMPLETE_PADRAO',
        valor_realizado: habit.tipo_medida === 'TEMPO' ? (habit.meta_base + overachieveTime) : quantity
      };

      const res = await submitExecution(habit.id, payload);
      clearTimerState();
      navigate('/success', { state: { bonus: isExtra, feedback: res.data } });
    } catch (err) {
      console.error(err);
    }
  };

  const handleGiveUp = async (type) => {
    try {
      pause();
      const payload = {
        execution_token: executionToken,
        tipo: type, 
        valor_realizado: habit.tipo_medida === 'TEMPO' ? (habit.meta_base - timeLeft) : quantity
      };

      const res = await submitExecution(habit.id, payload);
      clearTimerState();
      navigate('/fail', { state: { type, feedback: res.data } });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <ExecutionContainer>
      <HeaderWrapper>
        <HeaderLabel>Focando em</HeaderLabel>
        <HeaderTitle>{habit.titulo}</HeaderTitle>
      </HeaderWrapper>

      <ContentWrapper>
        {habit.tipo_medida === 'TEMPO' ? (
          <MonospaceTimer isOverachieving={isOverachieving} overachieveTime={overachieveTime} timeLeft={timeLeft} />
        ) : (
          <CircularProgress quantity={quantity} meta_base={habit.meta_base} />
        )}

        {habit.tipo_medida === 'QUANTIDADE' && (
          <ControlsWrapper>
            <SubButton onClick={() => setQuantity(Math.max(0, quantity - 50))}>-50</SubButton>
            <AddButton onClick={() => setQuantity(quantity + 50)}>+50</AddButton>
          </ControlsWrapper>
        )}
      </ContentWrapper>

      <ActionsWrapper>
        <CompleteButtonWrapper $visible={isOverachieving || isQuantityDone}>
          <CompleteButton onClick={handleComplete}>
            CONCLUIR TAREFA
          </CompleteButton>
        </CompleteButtonWrapper>
        
        <GiveUpButton onClick={() => { pause(); setShowGiveUpModal(true); }}>
          Desistir
        </GiveUpButton>
      </ActionsWrapper>

      {showGiveUpModal && (
        <GiveUpModal 
          bloqueiosAcumulados={habit.bloqueios_acumulados} 
          handleGiveUp={handleGiveUp} 
          onCancel={() => { setShowGiveUpModal(false); resume(); }} 
        />
      )}

      {showPwaModal && (
        <PwaPauseModal 
          onResume={() => { setShowPwaModal(false); resume(); }}
          onTimeout={() => { setShowPwaModal(false); handleGiveUp('FAIL_TIMEOUT'); }}
        />
      )}
    </ExecutionContainer>
  );
};

export default ExecutionScreen;
