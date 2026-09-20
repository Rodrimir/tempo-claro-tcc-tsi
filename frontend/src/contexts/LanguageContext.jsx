import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IDIOMAS, IDIOMA_PADRAO, traduzir } from '../i18n';
import { useAuth } from './AuthContext';

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
  useEffect(() => {
    const doServidor = user?.preferencia_idioma;
    if (doServidor && IDIOMAS[doServidor] && doServidor !== idioma) {
      setIdioma(doServidor);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.preferencia_idioma]);

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
