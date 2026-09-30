import { useCallback, useEffect, useRef } from 'react';
import { AppState } from 'react-native';

const ATRASO_ANTES_DE_SEGURAR_MS = 150;
const INTERVALO_MS = 100;

export function useHoldToIncrement(aoTocar, aoSegurarTick) {
  const atrasoRef = useRef(null);
  const intervaloRef = useRef(null);
  const segurandoRef = useRef(false);

  const pararTudo = useCallback(() => {
    if (atrasoRef.current) {
      clearTimeout(atrasoRef.current);
      atrasoRef.current = null;
    }
    if (intervaloRef.current) {
      clearInterval(intervaloRef.current);
      intervaloRef.current = null;
    }
  }, []);

  const onPressIn = useCallback(() => {
    segurandoRef.current = false;
    atrasoRef.current = setTimeout(() => {
      segurandoRef.current = true;
      aoSegurarTick();
      intervaloRef.current = setInterval(aoSegurarTick, INTERVALO_MS);
    }, ATRASO_ANTES_DE_SEGURAR_MS);
  }, [aoSegurarTick]);

  const onPressOut = useCallback(() => {
    pararTudo();
    if (!segurandoRef.current) {
      aoTocar();
    }
  }, [aoTocar, pararTudo]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (estado) => {
      if (estado !== 'active') pararTudo();
    });
    return () => {
      subscription.remove();
      pararTudo();
    };
  }, [pararTudo]);

  return { onPressIn, onPressOut };
}
