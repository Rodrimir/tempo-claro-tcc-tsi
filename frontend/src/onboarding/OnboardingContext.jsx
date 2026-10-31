import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { deveMostrarGuia, FASES } from './passos';

const OnboardingContext = createContext(null);

// Estado do guia de primeiro acesso. Fica só na memória de propósito: se o app for fechado no
// meio, o guia recomeça do primeiro passo na próxima abertura, até a conta concluí-lo (o servidor
// guarda usu_onboarding_concluido_em).
export function OnboardingProvider({ children }) {
  const { user, isAuthenticated } = useAuth() || {};
  const ativo = Boolean(isAuthenticated) && deveMostrarGuia(user);
  const [fase, setFase] = useState(FASES.PREFERENCIAS);
  const [etapa, setEtapa] = useState(0);
  const [alvos, setAlvos] = useState({});
  // A tela inicial informa se a conta já tem hábitos: isso muda o último passo.
  const [temHabitos, setTemHabitos] = useState(false);

  const [ativoAntes, setAtivoAntes] = useState(ativo);
  if (ativo !== ativoAntes) {
    setAtivoAntes(ativo);
    setFase(FASES.PREFERENCIAS);
    setEtapa(0);
  }

  const registrarAlvo = useCallback((id, retangulo) => {
    setAlvos((atuais) => {
      const atual = atuais[id];
      if (atual && atual.x === retangulo.x && atual.y === retangulo.y && atual.w === retangulo.w && atual.h === retangulo.h) {
        return atuais;
      }
      return { ...atuais, [id]: retangulo };
    });
  }, []);

  const valor = useMemo(
    () => ({
      ativo,
      fase,
      etapa,
      alvos,
      temHabitos,
      setTemHabitos,
      emTour: ativo && fase === FASES.TOUR,
      comecarTour: () => {
        setEtapa(0);
        setFase(FASES.TOUR);
      },
      avancar: (total) => setEtapa((atual) => Math.min(atual + 1, total - 1)),
      registrarAlvo,
    }),
    [ativo, fase, etapa, alvos, temHabitos, registrarAlvo]
  );

  return <OnboardingContext.Provider value={valor}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  return (
    useContext(OnboardingContext) ?? {
      ativo: false,
      fase: FASES.PREFERENCIAS,
      etapa: 0,
      alvos: {},
      temHabitos: false,
      setTemHabitos: () => {},
      emTour: false,
      comecarTour: () => {},
      avancar: () => {},
      registrarAlvo: () => {},
    }
  );
}

// Registra um elemento da tela como alvo do spotlight. Devolve as props para espalhar numa View
// (ref, onLayout e collapsable). A posição é medida na janela, de novo a cada passo, porque o
// alvo pode ter mudado de lugar.
export function useAlvoDoGuia(id) {
  const { emTour, etapa, registrarAlvo } = useOnboarding();
  const ref = useRef(null);

  const medir = useCallback(() => {
    if (!emTour) return;
    ref.current?.measureInWindow?.((x, y, w, h) => {
      if (w > 0 && h > 0) registrarAlvo(id, { x, y, w, h });
    });
  }, [emTour, id, registrarAlvo]);

  useEffect(() => {
    if (!emTour) return undefined;
    const temporizador = setTimeout(medir, 60);
    return () => clearTimeout(temporizador);
  }, [emTour, etapa, medir]);

  return { ref, onLayout: medir, collapsable: false };
}
