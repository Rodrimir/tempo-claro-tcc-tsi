import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ToastContainer, ToastMessage } from '../components/common/Toast/styles';

const ToastContext = createContext(null);

// @audit-ok [E1.8 (item 2) — evento em window para código FORA da árvore React
// (services/api.js, um módulo comum, não um componente) conseguir disparar um
// toast sem poder chamar useToast(). O interceptor de 401 usa isto.]
const EVENTO_TOAST_GLOBAL = 'tempoClaro:toast';

// @audit-ok [E1.8 — duração da animação fadeOut definida em Toast/styles.js.
// Precisa bater com o keyframe (0.3s) para o toast só sumir da lista DEPOIS
// de a animação de saída terminar de rodar.]
const DURACAO_FADE_MS = 300;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // @audit-ok [E1.8 (item 4) — antes o toast era removido de golpe do array
  // (sem aplicar a classe "fading" que styles.js já define com @keyframes
  // fadeOut). Agora marca "saindo" primeiro, deixa a animação rodar, e só
  // então tira da lista. Serve tanto para o timeout automático quanto para o
  // toque manual de dispensar.]
  const dispensarToast = useCallback((id) => {
    setToasts(prev => prev.map(t => (t.id === id ? { ...t, saindo: true } : t)));
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, DURACAO_FADE_MS);
  }, []);

  const addToast = useCallback((message, type = 'default', duration = 3000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts(prev => [...prev, { id, message, type, saindo: false }]);
    setTimeout(() => dispensarToast(id), duration);
  }, [dispensarToast]);

  // @audit-ok [E1.8 (item 2) — ponte para o interceptor de 401 em api.js]
  useEffect(() => {
    const handler = (e) => {
      const { message, type, duration } = e.detail || {};
      if (message) addToast(message, type, duration);
    };
    window.addEventListener(EVENTO_TOAST_GLOBAL, handler);
    return () => window.removeEventListener(EVENTO_TOAST_GLOBAL, handler);
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer>
        {toasts.map(toast => (
          // @audit-ok [E1.8 (item 4) — dispensável por toque: onClick chama o
          // mesmo dispensarToast do timeout automático]
          <ToastMessage
            key={toast.id}
            $type={toast.type}
            className={toast.saindo ? 'fading' : ''}
            onClick={() => dispensarToast(toast.id)}
            role="alert"
            aria-live="polite"
          >
            {toast.type === 'success' && 'V'}
            {toast.type === 'error' && 'X'}
            {toast.message}
          </ToastMessage>
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
