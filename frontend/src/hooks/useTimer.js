import { useState, useEffect, useCallback, useRef } from 'react';
import { saveExecutionState, loadExecutionState, clearExecutionState, isWithinTolerance } from '../utils/storage';
export const useTimer = (initialSeconds, habitId, executionToken, isTimer = true) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(isTimer);
  const [isOverachieving, setIsOverachieving] = useState(false);
  const timerRef = useRef(null);
  const [overachieveTime, setOverachieveTime] = useState(0);
  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };
  const pause = useCallback(() => {
    if (!isTimer) return;
    setIsActive(false);
    clearTimer();
    saveExecutionState(habitId, executionToken, {
      timeLeft,
      isOverachieving,
      overachieveTime
    }, Date.now());
  }, [habitId, executionToken, timeLeft, isOverachieving, overachieveTime, isTimer]);
  const resume = useCallback(() => {
    if (!isTimer) return;
    const savedState = loadExecutionState(habitId);
    if (savedState) {
      if (!isWithinTolerance(savedState.startedAt)) {
        clearExecutionState(habitId);
        return;
      }
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
  useEffect(() => {
    if (!isActive || !isTimer) return;
    timerRef.current = setInterval(() => {
      if (!isOverachieving) {
        setTimeLeft(prev => {
          if (prev <= 1) {
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
  }, [isActive, isOverachieving, isTimer]);
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
    clearTimerState: () => clearExecutionState(habitId)
  };
};
