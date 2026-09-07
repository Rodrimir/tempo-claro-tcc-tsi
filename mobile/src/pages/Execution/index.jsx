import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { BackHandler } from 'react-native';
import * as Crypto from 'expo-crypto';
import { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTimer } from '../../hooks/useTimer';
import { submitExecution, getDashboard } from '../../services/api';
import { useCurrentHabit } from '../../contexts/CurrentHabitContext';
import { useExecutionResult } from '../../contexts/ExecutionResultContext';
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
  SubButtonText,
  AddButton,
  AddButtonText,
  ActionsWrapper,
  CompleteButtonWrapper,
  CompleteButton,
  CompleteButtonText,
  GiveUpButton,
  GiveUpButtonText,
} from './styles';

const ExecutionScreen = () => {
  const router = useRouter();
  const { currentHabit, setCurrentHabit } = useCurrentHabit();
  const [habit, setHabit] = useState(currentHabit || null);
  const [fase, setFase] = useState(currentHabit ? 'pronto' : 'recuperando');

  useEffect(() => {
    if (currentHabit) {
      saveExecutingHabitId(currentHabit.id);
      setHabit(currentHabit);
      setFase('pronto');
      return;
    }

    let cancelado = false;
    (async () => {
      const habitoIdSalvo = await loadExecutingHabitId();
      if (!habitoIdSalvo) {
        router.replace('/home');
        return;
      }
      try {
        const res = await getDashboard();
        if (cancelado) return;
        const lista = res.data.habits || res.data || [];
        const encontrado = lista.find((h) => h.id === habitoIdSalvo);
        if (!encontrado) {
          await clearExecutingHabitId();
          router.replace('/home');
          return;
        }
        await saveExecutingHabitId(encontrado.id);
        setCurrentHabit(encontrado);
        setHabit(encontrado);
        setFase('pronto');
      } catch {
        if (!cancelado) router.replace('/home');
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [currentHabit]);

  if (fase !== 'pronto' || !habit) {
    return <LoadingScreen message="Retomando sua execução" />;
  }

  return <ExecutionActive habit={habit} />;
};

const ExecutionActive = ({ habit }) => {
  const router = useRouter();
  const { addToast } = useToast();
  const { setExecutionResult } = useExecutionResult();
  const [executionToken, setExecutionToken] = useState('');
  const [showGiveUpModal, setShowGiveUpModal] = useState(false);
  const [quantity, setQuantity] = useState(0);

  const metaOcorrenciaAtual = habit.alvo_ocorrencia_atual ?? habit.meta_base;
  const passo = Math.max(1, Math.round(metaOcorrenciaAtual / 10));

  useEffect(() => {
    setExecutionToken(Crypto.randomUUID());
  }, []);

  const { timeLeft, overachieveTime, isOverachieving, pause, resume, clearTimerState } = useTimer(
    habit.tipo_medida === 'TEMPO' ? metaOcorrenciaAtual : 0,
    habit.id,
    executionToken,
    habit.tipo_medida === 'TEMPO'
  );

  useEffect(() => {
    if (!executionToken) return;
    resume();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [executionToken]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      pause();
      setShowGiveUpModal(true);
      return true;
    });
    return () => subscription.remove();
  }, [pause]);

  const isQuantityDone = quantity >= metaOcorrenciaAtual;
  const podeConcluir = isOverachieving || isQuantityDone;

  const estiloConcluir = useAnimatedStyle(() => ({
    opacity: withTiming(podeConcluir ? 1 : 0, { duration: 500 }),
  }));

  const handleComplete = async () => {
    try {
      pause();
      const payload = {
        execution_token: executionToken,
        valor_realizado: habit.tipo_medida === 'TEMPO' ? metaOcorrenciaAtual + overachieveTime : quantity,
      };
      const res = await submitExecution(habit.id, payload);
      await clearTimerState();
      await clearExecutingHabitId();
      setExecutionResult({ feedback: res.data });
      router.replace('/success');
    } catch (err) {
      addToast('Erro ao registrar conclusão. Tente novamente.', 'error');
    }
  };

  const handleGiveUp = async (type) => {
    try {
      pause();
      const payload = {
        execution_token: executionToken,
        tipo: type,
        valor_realizado: habit.tipo_medida === 'TEMPO' ? metaOcorrenciaAtual - timeLeft : quantity,
      };
      const res = await submitExecution(habit.id, payload);
      await clearTimerState();
      await clearExecutingHabitId();
      setExecutionResult({ type, feedback: res.data });
      router.replace('/fail');
    } catch (err) {
      addToast('Erro ao registrar desistência. Tente novamente.', 'error');
    }
  };

  return (
    <ExecutionContainer>
      <HeaderWrapper>
        <HeaderLabel>Focando em</HeaderLabel>
        <HeaderTitle>{habit.titulo}</HeaderTitle>
        {habit.meta_frequencia_diaria > 1 ? (
          <HeaderLabel>
            {habit.execucoes_hoje || 0} de {habit.meta_frequencia_diaria} hoje
          </HeaderLabel>
        ) : null}
      </HeaderWrapper>

      <ContentWrapper>
        {habit.tipo_medida === 'TEMPO' ? (
          <MonospaceTimer isOverachieving={isOverachieving} overachieveTime={overachieveTime} timeLeft={timeLeft} />
        ) : (
          <CircularProgress quantity={quantity} meta_base={metaOcorrenciaAtual} onQuantityChange={setQuantity} />
        )}

        {habit.tipo_medida === 'QUANTIDADE' && (
          <ControlsWrapper>
            <SubButton onPress={() => setQuantity(Math.max(0, quantity - passo))}>
              <SubButtonText>-{passo}</SubButtonText>
            </SubButton>
            <AddButton onPress={() => setQuantity(quantity + passo)}>
              <AddButtonText>+{passo}</AddButtonText>
            </AddButton>
          </ControlsWrapper>
        )}
      </ContentWrapper>

      <ActionsWrapper>
        <CompleteButtonWrapper style={estiloConcluir} pointerEvents={podeConcluir ? 'auto' : 'none'}>
          <CompleteButton onPress={handleComplete}>
            <CompleteButtonText>CONCLUIR TAREFA</CompleteButtonText>
          </CompleteButton>
        </CompleteButtonWrapper>

        <GiveUpButton
          onPress={() => {
            pause();
            setShowGiveUpModal(true);
          }}
        >
          <GiveUpButtonText>Desistir</GiveUpButtonText>
        </GiveUpButton>
      </ActionsWrapper>

      {showGiveUpModal && (
        <GiveUpModal
          bloqueiosAcumulados={habit.bloqueios_acumulados}
          handleGiveUp={handleGiveUp}
          onCancel={() => {
            setShowGiveUpModal(false);
            resume();
          }}
        />
      )}
    </ExecutionContainer>
  );
};

export default ExecutionScreen;
