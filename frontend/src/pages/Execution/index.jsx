import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTimer } from '../../hooks/useTimer';
import { submitExecution, getDashboard } from '../../services/api';
import { useCurrentHabit } from '../../contexts/CurrentHabitContext';
import { useToast } from '../../contexts/ToastContext';
import { saveExecutingHabitId, loadExecutingHabitId, clearExecutingHabitId } from '../../utils/storage';
import CircularProgress from '../../components/common/CircularProgress';
import MonospaceTimer from '../../components/common/MonospaceTimer';
import GiveUpModal from '../../components/common/GiveUpModal';
import PwaPauseModal from '../../components/common/PwaPauseModal';
import LoadingScreen from '../../components/common/LoadingScreen';
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

// @audit-ok [E1.2 — ExecutionScreen só resolve QUAL hábito está em execução
// (contexto em memória, ou recuperado do sessionStorage depois de um F5) e
// decide entre loading, redirecionar para /home, ou montar ExecutionActive.
// useTimer só é chamado dentro de ExecutionActive, DEPOIS de o hábito real
// estar resolvido: se fosse chamado aqui com o hábito ainda desconhecido, o
// useState(initialSeconds) do hook capturaria o valor errado no primeiro
// render e nunca mais corrigiria sozinho (useState só usa o valor inicial
// uma vez). É esse acoplamento que fazia o "Modo Anônimo" existir antes —
// alguma meta_base precisava estar pronta na hora do useTimer rodar.]
const ExecutionScreen = () => {
  const navigate = useNavigate();
  const { currentHabit, setCurrentHabit } = useCurrentHabit();
  const [habit, setHabit] = useState(currentHabit || null);
  const [fase, setFase] = useState(currentHabit ? 'pronto' : 'recuperando');

  useEffect(() => {
    if (currentHabit) {
      // @audit-ok [E1.2 (item 1) — persiste o id do hábito em execução a cada
      // montagem com hábito conhecido, para um F5 seguinte ainda se recuperar]
      saveExecutingHabitId(currentHabit.id);
      setHabit(currentHabit);
      setFase('pronto');
      return;
    }

    // @audit-ok [E1.2 (item 2) — currentHabit é estado em memória: some ao
    // recarregar a página. Tenta recuperar qual hábito estava em execução
    // pelo sessionStorage antes de desistir.]
    const habitoIdSalvo = loadExecutingHabitId();
    if (!habitoIdSalvo) {
      // @audit-ok [E1.2 (item 3) — mesmo guard que /pretask já usa]
      navigate('/home', { replace: true });
      return;
    }

    let cancelado = false;
    getDashboard()
      .then(res => {
        if (cancelado) return;
        const lista = res.data.habits || res.data || [];
        const encontrado = lista.find(h => h.id === habitoIdSalvo);
        if (!encontrado) {
          // Hábito não existe mais (arquivado/apagado) — sessionStorage ficou
          // apontando para nada válido.
          clearExecutingHabitId();
          navigate('/home', { replace: true });
          return;
        }
        saveExecutingHabitId(encontrado.id);
        setCurrentHabit(encontrado);
        setHabit(encontrado);
        setFase('pronto');
      })
      .catch(() => {
        if (!cancelado) navigate('/home', { replace: true });
      });

    return () => { cancelado = true; };
  }, [currentHabit, navigate, setCurrentHabit]);

  if (fase !== 'pronto' || !habit) {
    return <LoadingScreen message="Retomando sua execução" />;
  }

  return <ExecutionActive habit={habit} />;
};

// @audit-ok [E1.2 — só monta depois que ExecutionScreen já resolveu um hábito
// de verdade. Nunca mais existe fallback "Modo Anônimo" nem meta_base=1500
// hardcoded — se chegou aqui, habit.id é sempre um hábito real do usuário.]
const ExecutionActive = ({ habit }) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [executionToken, setExecutionToken] = useState('');
  const [showGiveUpModal, setShowGiveUpModal] = useState(false);
  const [showPwaModal, setShowPwaModal] = useState(false);
  const [quantity, setQuantity] = useState(0);

  // @audit-ok [Execução Timer (2) — gera token único de idempotência para esta sessão de execução]
  useEffect(() => {
    const token = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
    setExecutionToken(token);
  }, []);

  // @audit-ok [Execução Timer (3) — inicializa o hook do timer com a meta do hábito em segundos]
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

  // @audit-ok [E1.2 — retoma do localStorage (e compensa o tempo que passou)
  // assim que o token de execução está pronto. Antes desta tarefa nada
  // chamava resume() na montagem: um F5 media o hábito certo só depois desta
  // correção, mas reiniciava o timer do zero mesmo assim. Numa 1ª execução
  // (nada salvo ainda) resume() é inofensivo — só ativa o timer.]
  useEffect(() => {
    if (!executionToken) return;
    resume();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [executionToken]);

  const isQuantityDone = quantity >= habit.meta_base;

  // @audit-ok [Execução Timer (14) — processa conclusão: calcula bônus, envia para API e navega para sucesso]
  const handleComplete = async () => {
    try {
      // @audit-ok [Execução Timer (15) — pausa o timer antes de enviar]
      pause();
      // @audit-ok [Execução Timer (16) — determina se merece bônus: ultrapassou 20% da meta]
      const isExtra = habit.tipo_medida === 'TEMPO'
        ? isOverachieving && overachieveTime >= (habit.meta_base * 0.2)
        : quantity >= (habit.meta_base * 1.2);

      const payload = {
        execution_token: executionToken,
        tipo: isExtra ? 'COMPLETE_EXTRA' : 'COMPLETE_PADRAO',
        valor_realizado: habit.tipo_medida === 'TEMPO' ? (habit.meta_base + overachieveTime) : quantity
      };

      // @audit-ok [Execução Timer (17) — envia POST /habits/{id}/executions]
      const res = await submitExecution(habit.id, payload);
      // @audit-ok [Execução Timer (27) — limpa estado salvo do localStorage]
      clearTimerState();
      // @audit-ok [E1.2 — limpa também o ponteiro de "hábito em execução"]
      clearExecutingHabitId();
      // @audit-ok [Execução Timer (28) — navega para tela de sucesso passando dados da recompensa]
      navigate('/success', { state: { bonus: isExtra, feedback: res.data } });
    } catch (err) {
      addToast('Erro ao registrar conclusão. Tente novamente.', 'error');
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
        valor_realizado: habit.tipo_medida === 'TEMPO' ? (habit.meta_base - timeLeft) : quantity
      };
      // @audit-ok [Desistência (8) — envia POST /habits/{id}/executions com tipo FAIL]
      const res = await submitExecution(habit.id, payload);
      // @audit-ok [Desistência (15) — limpa estado salvo do localStorage]
      clearTimerState();
      // @audit-ok [E1.2 — limpa também o ponteiro de "hábito em execução"]
      clearExecutingHabitId();
      // @audit-ok [Desistência (16) — navega para tela de falha]
      navigate('/fail', { state: { type, feedback: res.data } });
    } catch (err) {
      addToast('Erro ao registrar desistência. Tente novamente.', 'error');
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
