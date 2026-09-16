import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useColorScheme, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

const ThemeToggleContext = createContext();
export const useThemeToggle = () => useContext(ThemeToggleContext);

const TEMAS_VALIDOS = ['claro', 'escuro', 'sistema', 'dinamico'];
const STORAGE_KEY = 'tema';

// PLANO_REESTRUTURACAO.md, G — escuro das 18h às 5h59, claro no resto. É o
// horário LOCAL do fuso escolhido no Perfil (usu_fuso_horario), não o do
// aparelho — por isso não é um sinônimo de 'sistema', que segue o tema do SO.
const HORA_INICIO_ESCURO = 18;
const HORA_FIM_ESCURO = 6;
const FUSO_PADRAO = 'America/Sao_Paulo';

function horaLocalEm(fuso) {
  try {
    return Number(
      new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: fuso }).format(new Date())
    );
  } catch {
    // Fuso inválido/desconhecido do Intl (não deveria acontecer — o Perfil só
    // deixa escolher fusos da lista fixa em Profile/timezones.js) — cai no
    // fuso padrão em vez de travar o tema num estado indefinido.
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
  // Sem nada salvo (primeiro uso, ou cache limpo), o padrão é claro — não mais
  // "sistema": a escolha de seguir o tema do aparelho passou a ser só para quem
  // já tinha 'sistema' persistido antes da opção sair da UI (compatibilidade).
  const [tema, setTemaState] = useState('claro');
  const colorSchemeDoSistema = useColorScheme();
  const [isDark, setIsDark] = useState(false);
  const { user } = useAuth() || {};
  // Ref, não state: o relógio de 1 min só precisa LER o fuso mais recente
  // quando dispara, não precisa causar re-render por si só.
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

  // O tema dinâmico muda sozinho com o relógio, sem nenhuma ação da pessoa —
  // por isso precisa de um timer, diferente de claro/escuro/sistema (que só
  // mudam quando alguém mexe). Reavalia a cada minuto e também ao voltar do
  // background, porque o setInterval não roda com o app suspenso e a virada
  // das 18h/6h podia ter passado despercebida enquanto o app estava fechado.
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
