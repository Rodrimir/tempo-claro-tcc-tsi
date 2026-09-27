import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import * as Haptics from 'expo-haptics';
import { saveExecutionState, loadExecutionState, clearExecutionState, isWithinTolerance } from '@/utils/storage';

export const useTimer = (initialSeconds, habitId, executionToken, isTimer = true) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(false);
  const [isOverachieving, setIsOverachieving] = useState(false);
  const [overachieveTime, setOverachieveTime] = useState(0);
  const [pronto, setPronto] = useState(!isTimer);

  const intervalRef = useRef(null);
  const [deadlineInicial] = useState(() => Date.now() + initialSeconds * 1000);
  const deadlineRef = useRef(deadlineInicial);
  const stateRef = useRef({ isOverachieving: false });
  const executionTokenRef = useRef(executionToken);

  useEffect(() => {
    executionTokenRef.current = executionToken;
  }, [executionToken]);

  useEffect(() => {
    stateRef.current = { isOverachieving };
  }, [isOverachieving]);

  const clearTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const recompute = useCallback(() => {
    const diffMs = Date.now() - deadlineRef.current;
    if (diffMs < 0) {
      setTimeLeft(Math.ceil(-diffMs / 1000));
      setIsOverachieving(false);
      setOverachieveTime(0);
    } else {
      const jaEstavaOverachieving = stateRef.current.isOverachieving;
      setTimeLeft(0);
      setIsOverachieving(true);
      setOverachieveTime(Math.floor(diffMs / 1000));
      if (!jaEstavaOverachieving) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  }, []);

  const pause = useCallback(async () => {
    if (!isTimer) return;
    setIsActive(false);
    clearTimer();
    await saveExecutionState(habitId, executionTokenRef.current, { deadline: deadlineRef.current }, Date.now());
  }, [habitId, isTimer]);

  const resume = useCallback(async () => {
    if (!isTimer) return;
    const savedState = await loadExecutionState(habitId);
    if (savedState) {
      const dentroDaTolerancia = await isWithinTolerance(savedState.startedAt);
      if (!dentroDaTolerancia) {
        await clearExecutionState(habitId);
        return;
      }
      deadlineRef.current = savedState.elapsed.deadline;
      recompute();
    }
    setIsActive(true);
  }, [habitId, isTimer, recompute]);

  useEffect(() => {
    if (!isTimer) return;
    let cancelado = false;
    (async () => {
      const savedState = await loadExecutionState(habitId);
      if (savedState) {
        const dentroDaTolerancia = await isWithinTolerance(savedState.startedAt);
        if (!dentroDaTolerancia) {
          await clearExecutionState(habitId);
          if (cancelado) return;
          setPronto(true);
          return;
        }
        deadlineRef.current = savedState.elapsed.deadline;
      }
      if (cancelado) return;
      recompute();
      setIsActive(true);
      setPronto(true);
    })();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isTimer || !pronto) return;
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'background' || nextState === 'inactive') {
        pause();
      } else if (nextState === 'active') {
        resume();
      }
    });
    return () => {
      subscription.remove();
      clearTimer();
    };
  }, [pause, resume, isTimer, pronto]);

  useEffect(() => {
    if (!isActive || !isTimer) return;
    intervalRef.current = setInterval(recompute, 1000);
    return clearTimer;
  }, [isActive, isTimer, recompute]);

  return {
    pause,
    resume,
    timeLeft,
    overachieveTime,
    isOverachieving,
    clearTimerState: () => clearExecutionState(habitId),
  };
};
