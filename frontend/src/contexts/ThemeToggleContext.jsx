import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  const [isDark, setIsDark] = useState(false);
  const { user } = useAuth() || {};
  const fusoRef = useRef(user?.fuso_horario || FUSO_PADRAO);
  fusoRef.current = user?.fuso_horario || FUSO_PADRAO;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((salvo) => {
      if (TEMAS_VALIDOS.includes(salvo)) {
        setTemaState(salvo);
      }
    });
  }, []);

  useEffect(() => {
    if (tema === 'dinamico') {
      setIsDark(ehHorarioEscuro(fusoRef.current));
      return;
    }
    if (tema !== 'sistema') {
      setIsDark(tema === 'escuro');
      return;
    }
    setIsDark(colorSchemeDoSistema === 'dark');
  }, [tema, colorSchemeDoSistema]);

  useEffect(() => {
    if (tema !== 'dinamico') return;

    const reavaliar = () => setIsDark(ehHorarioEscuro(fusoRef.current));
    const id = setInterval(reavaliar, 60000);
    const subscription = AppState.addEventListener('change', (proximoEstado) => {
      if (proximoEstado === 'active') reavaliar();
    });
    return () => {
      clearInterval(id);
      subscription.remove();
    };
  }, [tema]);

  const setTema = useCallback((novoTema) => {
    if (!TEMAS_VALIDOS.includes(novoTema)) return;
    setTemaState(novoTema);
    AsyncStorage.setItem(STORAGE_KEY, novoTema);
  }, []);

  useEffect(() => {
    if (user?.tema && TEMAS_VALIDOS.includes(user.tema) && user.tema !== tema) {
      setTema(user.tema);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.tema]);

  return (
    <ThemeToggleContext.Provider value={{ isDark, tema, setTema }}>
      {children}
    </ThemeToggleContext.Provider>
  );
};
