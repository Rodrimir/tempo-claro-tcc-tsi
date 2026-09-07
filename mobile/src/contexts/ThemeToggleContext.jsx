import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

const ThemeToggleContext = createContext();
export const useThemeToggle = () => useContext(ThemeToggleContext);

const TEMAS_VALIDOS = ['claro', 'escuro', 'sistema'];
const STORAGE_KEY = 'tema';

export const ThemeToggleProvider = ({ children }) => {
  const [tema, setTemaState] = useState('sistema');
  const colorSchemeDoSistema = useColorScheme();
  const [isDark, setIsDark] = useState(colorSchemeDoSistema === 'dark');

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
