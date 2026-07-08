import { useEffect, useRef } from 'react';
import { getActiveSession, startSession, pauseSession, resumeSession } from '../services/api';

// @audit-ok [Sessão F09 — sincroniza o estado da execução com o servidor (/sessions).
// É best-effort: se o backend não tiver os endpoints, o timer local segue funcionando (RNF15)]

export const useSession = ({ habitId, subAtividadeId, getValorParcial, onAdopt, onTimeout }) => {
  const sessionIdRef = useRef(null);
  const valorRef = useRef(getValorParcial);
  const adoptRef = useRef(onAdopt);
  const timeoutRef = useRef(onTimeout);

  // @audit-ok [Sessão F09 — mantém os callbacks atuais sem recriar os listeners]
  useEffect(() => {
    valorRef.current = getValorParcial;
    adoptRef.current = onAdopt;
    timeoutRef.current = onTimeout;
  });

  // @audit-ok [Sessão F09 — cria ou adota a sessão viva ao montar a execução]
  useEffect(() => {
    if (!habitId) return undefined;
    let cancelled = false;

    const init = async () => {
      // @audit-info [Sessão F09 — 1) tenta adotar uma sessão viva existente (retomada após sair/matar o app)]
      try {
        const res = await getActiveSession(habitId);
        if (!cancelled && res?.data?.id) {
          sessionIdRef.current = res.data.id;
          if (adoptRef.current) adoptRef.current(res.data.valorParcial || 0);
          return;
        }
      } catch {
        // @audit-info [Sessão F09 — 404 = não há sessão viva; segue para criar uma nova]
      }
      // @audit-info [Sessão F09 — 2) cria uma nova sessão]
      try {
        const res = await startSession(habitId, { sub_atividade_id: subAtividadeId || null });
        if (!cancelled && res?.data?.id) sessionIdRef.current = res.data.id;
      } catch {
        // @audit-info [Sessão F09 — best-effort: o backend pode ainda não ter o endpoint]
      }
    };

    init();
    return () => { cancelled = true; };
  }, [habitId, subAtividadeId]);

  // @audit-ok [Sessão F09 — pausa/retoma no servidor conforme a visibilidade do app]
  useEffect(() => {
    if (!habitId) return undefined;

    const handleVisibility = async () => {
      const id = sessionIdRef.current;
      if (!id) return;
      if (document.hidden) {
        try {
          const valor = valorRef.current ? valorRef.current() : 0;
          await pauseSession(habitId, id, { valor_parcial: valor });
        } catch {
          // @audit-info [Sessão F09 — best-effort: falha ao pausar não interrompe o timer local]
        }
      } else {
        try {
          const res = await resumeSession(habitId, id);
          // @audit-info [Sessão F09 — passou de 1h: o backend já registrou FAIL_TIMEOUT; só sinalizamos a falha]
          if (res?.data?.estado === 'TIMEOUT' && timeoutRef.current) timeoutRef.current();
        } catch {
          // @audit-info [Sessão F09 — best-effort: falha ao retomar não interrompe o timer local]
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [habitId]);

  return { sessionIdRef };
};
