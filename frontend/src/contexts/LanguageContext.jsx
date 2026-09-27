import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IDIOMAS, IDIOMA_PADRAO, traduzir } from '@/i18n';
import { useAuth } from './AuthContext';
import { definirIdiomaDosErros } from '@/utils/erros';

const LanguageContext = createContext();

export const useI18n = () => {
  const contexto = useContext(LanguageContext);
  return (
    contexto ?? {
      idioma: IDIOMA_PADRAO,
      setIdioma: () => {},
      idiomas: IDIOMAS,
      t: (chave, valores) => traduzir(IDIOMA_PADRAO, chave, valores),
    }
  );
};

const STORAGE_KEY = 'idioma';

export const LanguageProvider = ({ children }) => {
  const [idioma, setIdiomaState] = useState(IDIOMA_PADRAO);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((salvo) => {
      if (salvo && IDIOMAS[salvo]) setIdiomaState(salvo);
    });
  }, []);

  const setIdioma = useCallback((novo) => {
    if (!IDIOMAS[novo]) return;
    setIdiomaState(novo);
    AsyncStorage.setItem(STORAGE_KEY, novo);
  }, []);

  const { user } = useAuth() || {};
  const idiomaDoServidor = user?.preferencia_idioma;
  const [idiomaDoServidorAnterior, setIdiomaDoServidorAnterior] = useState(idiomaDoServidor);

  if (idiomaDoServidor !== idiomaDoServidorAnterior) {
    setIdiomaDoServidorAnterior(idiomaDoServidor);
    if (idiomaDoServidor && IDIOMAS[idiomaDoServidor] && idiomaDoServidor !== idioma) {
      setIdiomaState(idiomaDoServidor);
      AsyncStorage.setItem(STORAGE_KEY, idiomaDoServidor);
    }
  }

  useEffect(() => {
    definirIdiomaDosErros(idioma);
  }, [idioma]);

  const valor = useMemo(
    () => ({
      idioma,
      setIdioma,
      idiomas: IDIOMAS,
      t: (chave, valores) => traduzir(idioma, chave, valores),
    }),
    [idioma, setIdioma]
  );

  return <LanguageContext.Provider value={valor}>{children}</LanguageContext.Provider>;
};
