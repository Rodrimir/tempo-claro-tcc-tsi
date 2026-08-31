import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const ThemeToggleContext = createContext();
export const useThemeToggle = () => useContext(ThemeToggleContext);

// @audit-ok [E3.4 — os três estados aceitos pela coluna usu_tema (CHECK
// ck_usu_tema no schema v2.1). 'sistema' é o padrão.]
const TEMAS_VALIDOS = ['claro', 'escuro', 'sistema'];
const STORAGE_KEY = 'tema';

function lerTemaSalvo() {
  try {
    const salvo = localStorage.getItem(STORAGE_KEY);
    return TEMAS_VALIDOS.includes(salvo) ? salvo : 'sistema';
  } catch {
    // localStorage indisponível (ex.: navegação privada em alguns navegadores) —
    // segue com o padrão 'sistema' só para esta sessão.
    return 'sistema';
  }
}

function prefereSistemaEscuro() {
  return typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false;
}

export const ThemeToggleProvider = ({ children }) => {
  // @audit-ok [E3.4 (item 3) — leitura síncrona nos useState iniciais: o tema
  // certo já está resolvido no primeiro render, sem esperar um useEffect (que
  // rodaria só depois da primeira pintura e causaria o flash). Antes,
  // main.jsx alterava a classe do body ANTES do React montar, mas essa classe
  // nunca teve nenhuma regra de CSS associada — quem de fato pintava a tela
  // era o ThemeProvider do App.jsx, que só reage depois de montado. O flash
  // relatado era, na prática, a escolha do usuário não sendo persistida:
  // recarregar sempre recomputava a partir do zero (preferência do SO).]
  const [tema, setTemaState] = useState(lerTemaSalvo);
  const [isDark, setIsDark] = useState(() =>
    tema === 'sistema' ? prefereSistemaEscuro() : tema === 'escuro'
  );

  // @audit-ok [E3.4 (item 2) — só ouve mudança do SO enquanto tema==='sistema';
  // em 'claro'/'escuro' explícitos a escolha do usuário manda, mesmo que o SO
  // mude no meio da sessão.]
  useEffect(() => {
    if (tema !== 'sistema') {
      setIsDark(tema === 'escuro');
      return;
    }
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDark(mediaQuery.matches);
    const aoMudarPreferenciaDoSistema = (e) => setIsDark(e.matches);
    mediaQuery.addEventListener('change', aoMudarPreferenciaDoSistema);
    return () => mediaQuery.removeEventListener('change', aoMudarPreferenciaDoSistema);
  }, [tema]);

  // @audit-ok [E3.4 (item 2) — persiste em localStorage. A persistência em
  // usu_tema no backend é responsabilidade de quem chama setTema numa tela
  // autenticada (Perfil, junto com o resto do formulário) — este contexto não
  // conhece a API, só o estado local.]
  // @audit-ok [E3.4 — useCallback com deps vazias: identidade estável entre
  // renders. Sem isso, telas que chamam setTema dentro de um useEffect (ex.:
  // Profile.jsx sincronizando com GET /me) precisariam escolher entre um
  // warning de dependência faltando ou um efeito que refaz fetch a cada
  // render do ThemeToggleProvider — o setState do useState já é
  // estável por garantia do React, então basta apoiar nele.]
  const setTema = useCallback((novoTema) => {
    if (!TEMAS_VALIDOS.includes(novoTema)) return;
    setTemaState(novoTema);
    try {
      localStorage.setItem(STORAGE_KEY, novoTema);
    } catch {
      // Escolha ainda vale para a sessão atual; só não sobrevive a um reload.
    }
  }, []);

  // @audit-ok [E3.4 (item 2) — sincroniza com o usu_tema salvo no backend
  // quando ele aparece no usuário autenticado (login em AuthResponseDTO.user,
  // ou um GET /me mais novo carregado pela tela de Perfil). Só age quando
  // vem um valor válido e diferente do atual — não sobrescreve a cada
  // renderização, e não existe usuário anônimo com tema pra sincronizar.]
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
