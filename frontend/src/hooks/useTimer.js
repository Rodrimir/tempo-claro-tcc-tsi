import { useState, useEffect, useCallback, useRef } from 'react';
import { saveExecutionState, loadExecutionState, clearExecutionState, isWithinTolerance } from '../utils/storage';

// @audit-ok [useTimer — hook de cronômetro regressivo com persistência no localStorage e compensação de tempo em background]

export const useTimer = (initialSeconds, habitId, executionToken, isTimer = true) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(isTimer);
  const [isOverachieving, setIsOverachieving] = useState(false);
  const [overachieveTime, setOverachieveTime] = useState(0);
  const timerRef = useRef(null);
  const stateRef = useRef({ timeLeft: initialSeconds, isOverachieving: false, overachieveTime: 0 });

  useEffect(() => {
    stateRef.current = { timeLeft, isOverachieving, overachieveTime };
  }, [timeLeft, isOverachieving, overachieveTime]);

  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // @audit-ok [Execução Timer (5) — pausa o timer e persiste estado no localStorage via stateRef]
  const pause = useCallback(() => {
    if (!isTimer) return;
    setIsActive(false);
    clearTimer();
    // @audit-ok [Execução Timer (7) — salva timeLeft, isOverachieving e overachieveTime encriptados]
    const { timeLeft: tl, isOverachieving: iso, overachieveTime: ot } = stateRef.current;
    saveExecutionState(habitId, executionToken, { timeLeft: tl, isOverachieving: iso, overachieveTime: ot }, Date.now());
  }, [habitId, executionToken, isTimer]);

  // @audit-ok [Execução Timer (8) — retoma do localStorage compensando o tempo que passou em background]
  const resume = useCallback(() => {
    if (!isTimer) return;
    // @audit-ok [Execução Timer (9) — carrega estado salvo do localStorage]
    const savedState = loadExecutionState(habitId);
    if (savedState) {
      // @audit-ok [Execução Timer (10) — rejeita retomada se passaram mais de 60 minutos]
      if (!isWithinTolerance(savedState.startedAt)) {
        clearExecutionState(habitId);
        return;
      }
      // @audit-ok [Execução Timer (11) — compensa segundos decorridos durante a pausa]
      const timeDiff = Math.floor((Date.now() - savedState.startedAt) / 1000);
      const { timeLeft: savedTimeLeft, isOverachieving: savedIsOver, overachieveTime: savedExtra } = savedState.elapsed;
      if (!savedIsOver) {
        const newTimeLeft = Math.max(0, savedTimeLeft - timeDiff);
        setTimeLeft(newTimeLeft);
        if (newTimeLeft === 0) {
          setIsOverachieving(true);
          setOverachieveTime(Math.abs(savedTimeLeft - timeDiff));
        }
      } else {
        setIsOverachieving(true);
        setOverachieveTime(savedExtra + timeDiff);
      }
    }
    setIsActive(true);
  }, [habitId, isTimer]);

  const start = useCallback(() => {
    if (!isTimer) return;
    setIsActive(true);
  }, [isTimer]);

  const stop = useCallback(() => {
    setIsActive(false);
    clearTimer();
    clearExecutionState(habitId);
  }, [habitId]);

  // @audit-ok [Execução Timer (4) — listener de visibilidade: pausa/retoma quando app vai para background]
  useEffect(() => {
    if (!isTimer) return;
    const handleVisibilityChange = () => {
      if (document.hidden) {
        pause();
      } else {
        resume();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearTimer();
    };
  }, [pause, resume, isTimer]);

  // @audit-ok [Execução Timer (4) — intervalo de 1 segundo que decrementa timeLeft ou incrementa overachieveTime]
  useEffect(() => {
    if (!isActive || !isTimer) return;
    timerRef.current = setInterval(() => {
      if (!stateRef.current.isOverachieving) {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // @audit-ok [Execução Timer (12) — timer chegou a zero: ativa modo overachieve e vibra o dispositivo]
            setIsOverachieving(true);
            if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            return 0;
          }
          return prev - 1;
        });
      } else {
        setOverachieveTime(prev => prev + 1);
      }
    }, 1000);
    return clearTimer;
  }, [isActive, isTimer]);

  const elapsed = (initialSeconds - timeLeft) + overachieveTime;

  return {
    elapsed,
    isRunning: isActive,
    isPaused: !isActive,
    start,
    pause,
    resume,
    stop,
    timeLeft,
    overachieveTime,
    isOverachieving,
    // @audit-ok [Execução Timer (27) — limpa estado do localStorage após conclusão ou desistência]
    clearTimerState: () => clearExecutionState(habitId)
  };
};
