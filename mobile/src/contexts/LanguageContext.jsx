import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IDIOMAS, IDIOMA_PADRAO, traduzir } from '../i18n';
import { useAuth } from './AuthContext';

const LanguageContext = createContext();

/**
 * Hook de tradução. `t('home.faltam', { tempo: '2h' })`.
 *
 * Devolve um valor utilizável mesmo fora do provider: componentes comuns como o
 * LoadingScreen podem ser montados durante o boot, e um `undefined` aqui viraria
 * um erro de desestruturação difícil de rastrear em vez de um texto em português.
 */
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

/**
 * Idioma da interface, espelhando o mesmo padrão do tema: guarda local para a
 * escolha valer já na abertura do app (antes de qualquer requisição), e
 * `usuarios.usu_preferencia_idioma` como fonte de verdade entre aparelhos.
 *
 * O idioma também governa o que o SERVIDOR devolve: biblioteca_textos é indexada
 * por (categoria, idioma), então frases de priming, textos de sucesso e o
 * questionário de calibração vêm traduzidos da API — não são traduzidos aqui.
 */
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
