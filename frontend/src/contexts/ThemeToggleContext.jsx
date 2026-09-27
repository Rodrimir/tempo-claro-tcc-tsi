import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useColorScheme, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

const ThemeToggleContext = createContext();
export const useThemeToggle = () => useContext(ThemeToggleContext);

const TEMAS_VALIDOS = ['claro', 'escuro', 'sistema', 'dinamico'];
const STORAGE_KEY = 'tema';

const HORA_INICIO_ESCURO = 18;
const HORA_FIM_ESCURO = 6;
const FUSO_PADRAO = 'America/Sao_Paulo';
const INTERVALO_REAVALIACAO_MS = 60000;

function horaLocalEm(fuso) {
  try {
    return Number(
      new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: fuso }).format(new Date())
    );
  } catch {
    return new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: FUSO_PADRAO }).format(
      new Date()
    );
  }
}

function ehHorarioEscuro(fuso) {
  const hora = horaLocalEm(fuso || FUSO_PADRAO);
  return hora >= HORA_INICIO_ESCURO || hora < HORA_FIM_ESCURO;
}

export const ThemeToggleProvider = ({ children }) => {
  const [tema, setTemaState] = useState('claro');
  const colorSchemeDoSistema = useColorScheme();
  const { user } = useAuth() || {};
  const fuso = user?.fuso_horario || FUSO_PADRAO;
  const [tiqueDoRelogio, setTiqueDoRelogio] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((salvo) => {
      if (TEMAS_VALIDOS.includes(salvo)) {
        setTemaState(salvo);
      }
    });
  }, []);

  useEffect(() => {
    if (tema !== 'dinamico') return;

    const reavaliar = () => setTiqueDoRelogio((anterior) => anterior + 1);
    const id = setInterval(reavaliar, INTERVALO_REAVALIACAO_MS);
    const subscription = AppState.addEventListener('change', (proximoEstado) => {
      if (proximoEstado === 'active') reavaliar();
    });
    return () => {
      clearInterval(id);
      subscription.remove();
    };
  }, [tema]);

  const isDark = useMemo(() => {
    if (tema === 'dinamico') return ehHorarioEscuro(fuso);
    if (tema !== 'sistema') return tema === 'escuro';
    return colorSchemeDoSistema === 'dark';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tema, fuso, colorSchemeDoSistema, tiqueDoRelogio]);

  const setTema = useCallback((novoTema) => {
    if (!TEMAS_VALIDOS.includes(novoTema)) return;
    setTemaState(novoTema);
    AsyncStorage.setItem(STORAGE_KEY, novoTema);
  }, []);

  const temaDoServidor = user?.tema;
  const [temaDoServidorAnterior, setTemaDoServidorAnterior] = useState(temaDoServidor);

  if (temaDoServidor !== temaDoServidorAnterior) {
    setTemaDoServidorAnterior(temaDoServidor);
    if (temaDoServidor && TEMAS_VALIDOS.includes(temaDoServidor) && temaDoServidor !== tema) {
      setTemaState(temaDoServidor);
      AsyncStorage.setItem(STORAGE_KEY, temaDoServidor);
    }
  }

  return (
    <ThemeToggleContext.Provider value={{ isDark, tema, setTema }}>
      {children}
    </ThemeToggleContext.Provider>
  );
};
