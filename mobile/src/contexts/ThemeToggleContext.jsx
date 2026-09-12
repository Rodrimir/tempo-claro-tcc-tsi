import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

const ThemeToggleContext = createContext();
export const useThemeToggle = () => useContext(ThemeToggleContext);

const TEMAS_VALIDOS = ['claro', 'escuro', 'sistema'];
const STORAGE_KEY = 'tema';

export const ThemeToggleProvider = ({ children }) => {
  // Sem nada salvo (primeiro uso, ou cache limpo), o padrão é claro — não mais
  // "sistema": a escolha de seguir o tema do aparelho passou a ser só para quem
  // já tinha 'sistema' persistido antes da opção sair da UI (compatibilidade).
  const [tema, setTemaState] = useState('claro');
  const colorSchemeDoSistema = useColorScheme();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((salvo) => {
      if (TEMAS_VALIDOS.includes(salvo)) {
        setTemaState(salvo);
      }
    });
  }, []);

  useEffect(() => {
    if (tema !== 'sistema') {
      setIsDark(tema === 'escuro');
      return;
    }
    setIsDark(colorSchemeDoSistema === 'dark');
  }, [tema, colorSchemeDoSistema]);

  const setTema = useCallback((novoTema) => {
    if (!TEMAS_VALIDOS.includes(novoTema)) return;
    setTemaState(novoTema);
    AsyncStorage.setItem(STORAGE_KEY, novoTema);
  }, []);

  const { user } = useAuth() || {};
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
