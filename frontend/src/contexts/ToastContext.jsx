// @audit-ok: FRONTEND-ToastContext.jsx-01
import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastContainer, ToastMessage } from '../components/common/Toast/styles';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'default', duration = 3000) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer>
        {toasts.map(toast => (
          <ToastMessage key={toast.id} $type={toast.type}>
            {toast.type === 'success' && '✅ '}
            {toast.type === 'error' && '⚠️ '}
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
