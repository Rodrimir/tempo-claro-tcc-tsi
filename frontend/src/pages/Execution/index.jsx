import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTimer } from '../../hooks/useTimer';
import { useSession } from '../../hooks/useSession';
import { submitExecution, getApiErrorMessage } from '../../services/api';
import { useCurrentHabit } from '../../contexts/CurrentHabitContext';
import { useToast } from '../../contexts/ToastContext';
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

// @audit-ok [Execução Timer (1) — tela de execução ativa: gerencia timer regressivo ou contador de quantidade]

const ExecutionScreen = () => {
  const navigate = useNavigate();
  const { currentHabit } = useCurrentHabit();
  const { addToast } = useToast();
  // @audit-ok [Execução Timer (2) — gera o token único de idempotência uma vez, já no primeiro render]
  const [executionToken] = useState(() =>
    (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2)));
  const [showGiveUpModal, setShowGiveUpModal] = useState(false);
  const [showPwaModal, setShowPwaModal] = useState(false);
  const [quantity, setQuantity] = useState(0);

  // @audit-ok [Execução Timer (3) — helper: seleciona a sub-atividade pendente/mais próxima do horário atual]
  const getNextSubActivity = (h) => {
    if (!h.sub_atividades || h.sub_atividades.length === 0) return null;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const sorted = [...h.sub_atividades].sort((a, b) => (a.horario_inicio || "23:59").localeCompare(b.horario_inicio || "23:59"));
    let next = sorted[sorted.length - 1];
    for (const sub of sorted) {
      if (!sub.horario_inicio) continue;
      const [hh, mm] = sub.horario_inicio.split(':').map(Number);
      if (hh * 60 + mm >= currentMinutes - 60) {
         next = sub; break;
      }
    }
    return next;
  };

  const habit = currentHabit || {
    id: 1,
    titulo: 'Modo Anônimo',
    tipo_medida: 'TEMPO',
    meta_base: 1500,
    escudosDisponiveis: 0
  };

  // @audit-ok [Execução (2b) — sub-atividade desta execução (fixada no início); alvo = porção da parte ou meta cheia]
  const [sessionSub] = useState(() => getNextSubActivity(habit));
  const sessionSubId = sessionSub ? sessionSub.id : null;
  const alvo = (sessionSub && sessionSub.alvo_parcial) ? sessionSub.alvo_parcial : habit.meta_base;

  // @audit-ok [Execução Timer (3) — inicializa o hook do timer com o alvo desta execução (em segundos)]
  const {
    timeLeft,
    overachieveTime,
    isOverachieving,
    pause,
    resume,
    clearTimerState
  } = useTimer(
    habit.tipo_medida === 'TEMPO' ? alvo : 0,
    habit.id,
    executionToken,
    habit.tipo_medida === 'TEMPO'
  );

  const isQuantityDone = quantity >= alvo;

  // @audit-ok [Sessão F09 — mantém o valor parcial atual (segundos ou ml) para enviar no pause]
  const valorParcialRef = useRef(0);
  useEffect(() => {
    valorParcialRef.current = habit.tipo_medida === 'TEMPO'
      ? Math.max(0, (alvo - timeLeft) + overachieveTime)
      : quantity;
  });

  // @audit-ok [Sessão F09 — ao adotar uma sessão viva, restaura o progresso parcial salvo]
  const handleAdopt = (valorParcial) => {
    if (habit.tipo_medida === 'QUANTIDADE' && valorParcial > 0) {
      setQuantity(valorParcial);
    }
  };

  // @audit-ok [Sessão F09 — TIMEOUT no servidor (>1h): o backend já registrou FAIL_TIMEOUT]
  const handleSessionTimeout = () => {
    clearTimerState();
    navigate('/fail', { state: { type: 'FAIL_TIMEOUT' } });
  };

  // @audit-ok [Sessão F09 — cria/adota a sessão e sincroniza pausa/retomada por visibilidade]
  useSession({
    habitId: habit.id,
    subAtividadeId: sessionSubId,
    getValorParcial: () => valorParcialRef.current,
    onAdopt: handleAdopt,
    onTimeout: handleSessionTimeout
  });

  // @audit-ok [Execução Timer (14) — processa conclusão: envia para API e navega para sucesso]
  const handleComplete = async () => {
    try {
      // @audit-ok [Execução Timer (15) — pausa o timer antes de enviar]
      pause();
      // @audit-ok [Execução Timer (16) — Antifraude (RNF08): o servidor decide padrão/extra.
      // Enviamos sempre COMPLETE_PADRAO; o backend promove a COMPLETE_EXTRA conforme valor_realizado]
      const payload = {
        execution_token: executionToken,
        tipo: 'COMPLETE_PADRAO',
        valor_realizado: habit.tipo_medida === 'TEMPO' ? (alvo + overachieveTime) : quantity,
        sub_atividade_id: sessionSubId
      };

      // @audit-ok [Execução Timer (17) — envia POST /habits/{id}/executions]
      const res = await submitExecution(habit.id, payload);
      // @audit-ok [Execução Timer (18) — o bônus é derivado da recompensa retornada (padrão 100 / extra 150)]
      const isExtra = (res.data?.moedas_ganhas || 0) > 100;
      // @audit-ok [Execução Timer (27) — limpa estado salvo do localStorage]
      clearTimerState();
      // @audit-ok [Execução Timer (28) — navega para tela de sucesso passando dados da recompensa]
      navigate('/success', { state: { bonus: isExtra, feedback: res.data } });
    } catch (err) {
      addToast(getApiErrorMessage(err, 'Erro ao registrar conclusão. Tente novamente.'), 'error');
    }
  };

  // @audit-ok [Desistência (5) — processa desistência: envia tipo de falha para API e navega para fail]
  const handleGiveUp = async (type) => {
    try {
      // @audit-ok [Desistência (6) — pausa o timer antes de enviar]
      pause();
      
      // @audit-ok [Desistência (7) — monta payload com tipo de falha e valor parcial realizado]
      const payload = {
        execution_token: executionToken,
        tipo: type,
        valor_realizado: habit.tipo_medida === 'TEMPO' ? (alvo - timeLeft) : quantity,
        sub_atividade_id: sessionSubId
      };
      // @audit-ok [Desistência (8) — envia POST /habits/{id}/executions com tipo FAIL]
      const res = await submitExecution(habit.id, payload);
      // @audit-ok [Desistência (15) — limpa estado salvo do localStorage]
      clearTimerState();
      // @audit-ok [Desistência (16) — navega para tela de falha]
      navigate('/fail', { state: { type, feedback: res.data } });
    } catch (err) {
      addToast(getApiErrorMessage(err, 'Erro ao registrar desistência. Tente novamente.'), 'error');
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
          <CircularProgress quantity={quantity} meta_base={alvo} />
        )}

        {habit.tipo_medida === 'QUANTIDADE' && (
          <ControlsWrapper>
            <SubButton onClick={() => setQuantity(Math.max(0, quantity - 50))}>-50</SubButton>
            <AddButton onClick={() => setQuantity(quantity + 50)}>+50</AddButton>
          </ControlsWrapper>
        )}
      </ContentWrapper>

      <ActionsWrapper>
        {/* @audit-ok [Execução Timer (13) — botão CONCLUIR aparece somente quando timer zera ou quantidade atingida] */}
        <CompleteButtonWrapper $visible={isOverachieving || isQuantityDone}>
          <CompleteButton onClick={handleComplete}>CONCLUIR TAREFA</CompleteButton>
        </CompleteButtonWrapper>

        {/* @audit-ok [Desistência (1) — botão Desistir pausa o timer e abre o modal de confirmação] */}
        <GiveUpButton onClick={() => { pause(); setShowGiveUpModal(true); }}>
          Desistir
        </GiveUpButton>
      </ActionsWrapper>

      {/* @audit-ok [Desistência (3) — modal exibe opções com base nos bloqueios disponíveis] */}
      {showGiveUpModal && (
        <GiveUpModal
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
