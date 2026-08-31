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
  // @audit-ok [E3.3 (item 4) — PwaPauseModal removido: setShowPwaModal(true)
  // nunca existiu em lugar nenhum do código (só false, dentro dos próprios
  // callbacks do modal que nunca disparavam). useTimer.js já pausa/retoma
  // sozinho no visibilitychange (E1.2) — resume() acontece sem perguntar
  // nada ao usuário, então o modal nunca tinha como aparecer de verdade.]
  const [quantity, setQuantity] = useState(0);

  // @audit-ok [E2.8 (item 3) — a meta desta EXECUÇÃO é o alvo da ocorrência
  // atual (sub_alvo), não mais sempre o meta_base do dia inteiro. Pra hábito
  // de 1x/dia os dois são sempre iguais (a única ocorrência tem alvo =
  // meta_base ÷ 1), então nada muda pra nenhum hábito de 1x/dia — só passa a
  // valer de verdade pra hábito de N vezes ao dia, que antes da E2.8 não tinha
  // como saber "quanto falta SÓ desta vez". Fallback pra meta_base cobre
  // hábitos sem sub_atividade ainda (não deveria acontecer, mas não quebra).]
  const metaOcorrenciaAtual = habit.alvo_ocorrencia_atual ?? habit.meta_base;

  // @audit-ok [E2.7 (item 1) — passo proporcional à meta, não mais fixo em 50.
  // 50 fixo fazia um hábito de "10 flexões" passar de 0% a 500% no primeiro
  // toque, e um hábito de 2000ml precisar de 40 toques pra completar.
  // max(1, ...) evita passo 0 em metas pequenas (ex.: meta=5 arredondaria pra 0).
  // E2.8: agora sobre metaOcorrenciaAtual — um hábito de 2100ml em 3x tem
  // passo baseado em 700, não nos 2100 do dia inteiro.]
  const passo = Math.max(1, Math.round(metaOcorrenciaAtual / 10));

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
    habit.tipo_medida === 'TEMPO' ? metaOcorrenciaAtual : 0,
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

  const isQuantityDone = quantity >= metaOcorrenciaAtual;

  // @audit-ok [E1.6 — RF22/RNF08: o cliente não decide mais padrão vs extra.
  // Antes calculava isExtra aqui e mandava tipo: 'COMPLETE_EXTRA'/'COMPLETE_PADRAO'
  // — um cliente adulterado podia sempre mandar EXTRA e ganhar 150 moedas sem
  // ter feito por merecer. Agora só manda o que de fato aconteceu
  // (valor_realizado); GamificacaoService.processarExecucao recalcula o bônus
  // no servidor e devolve moedas_ganhas/bonus prontos.]
  const handleComplete = async () => {
    try {
      // @audit-ok [Execução Timer (15) — pausa o timer antes de enviar]
      pause();

      // @audit-ok [E1.6 (item 4) — payload só com execution_token e valor_realizado.
      // E2.8: valor_realizado passa a ser sobre a ocorrência atual
      // (metaOcorrenciaAtual), não o meta_base do dia — StatsService (E2.2) já
      // SOMA valor_realizado por dia entre várias execuções, então isso é
      // exatamente o que faz um dia de 3 execuções de 700 aparecer como 2100
      // no gráfico, em vez de exigir uma execução só valendo o dia inteiro.]
      const payload = {
        execution_token: executionToken,
        valor_realizado: habit.tipo_medida === 'TEMPO' ? (metaOcorrenciaAtual + overachieveTime) : quantity
      };

      // @audit-ok [Execução Timer (17) — envia POST /habits/{id}/executions]
      const res = await submitExecution(habit.id, payload);
      // @audit-ok [Execução Timer (27) — limpa estado salvo do localStorage]
      clearTimerState();
      // @audit-ok [E1.2 — limpa também o ponteiro de "hábito em execução"]
      clearExecutingHabitId();
      // @audit-ok [Execução Timer (28) / E1.6 (item 5) — a tela de Sucesso lê
      // "bonus" exclusivamente de res.data (decidido pelo servidor)]
      navigate('/success', { state: { feedback: res.data } });
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
        valor_realizado: habit.tipo_medida === 'TEMPO' ? (metaOcorrenciaAtual - timeLeft) : quantity
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
        {/* @audit-ok [E2.8 (item 3) — "2 de 3 hoje" também na execução, não só
            no card do Home; só aparece pra hábito de mais de 1x/dia.] */}
        {habit.meta_frequencia_diaria > 1 && (
          <HeaderLabel>{habit.execucoes_hoje || 0} de {habit.meta_frequencia_diaria} hoje</HeaderLabel>
        )}
      </HeaderWrapper>

      <ContentWrapper>
        {habit.tipo_medida === 'TEMPO' ? (
          <MonospaceTimer isOverachieving={isOverachieving} overachieveTime={overachieveTime} timeLeft={timeLeft} />
        ) : (
          // @audit-ok [E2.7 (item 3) — onQuantityChange habilita a edição manual
          // tocando no número central; sem esta prop o componente continuaria
          // só de leitura (ver CircularProgress/index.jsx).]
          <CircularProgress quantity={quantity} meta_base={metaOcorrenciaAtual} onQuantityChange={setQuantity} />
        )}

        {/* @audit-ok [E2.7 (item 2) — rótulo mostra o passo real (-200/+200,
            -1/+1...), nunca mais "50" fixo.] */}
        {habit.tipo_medida === 'QUANTIDADE' && (
          <ControlsWrapper>
            <SubButton onClick={() => setQuantity(Math.max(0, quantity - passo))}>-{passo}</SubButton>
            <AddButton onClick={() => setQuantity(quantity + passo)}>+{passo}</AddButton>
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
    </ExecutionContainer>
  );
};

export default ExecutionScreen;
