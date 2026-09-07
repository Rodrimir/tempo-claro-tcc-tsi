import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { DeviceEventEmitter, Text, View } from 'react-native';

const ToastContext = createContext(null);

const EVENTO_TOAST_GLOBAL = 'tempoClaro:toast';
const DURACAO_FADE_MS = 300;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dispensarToast = useCallback((id) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, saindo: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, DURACAO_FADE_MS);
  }, []);

  const addToast = useCallback((message, type = 'default', duration = 3000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev, { id, message, type, saindo: false }]);
    setTimeout(() => dispensarToast(id), duration);
  }, [dispensarToast]);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(EVENTO_TOAST_GLOBAL, (detail) => {
      const { message, type, duration } = detail || {};
      if (message) addToast(message, type, duration);
    });
    return () => subscription.remove();
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0 }} pointerEvents="box-none">
        {toasts.map((toast) => (
          <Text key={toast.id} onPress={() => dispensarToast(toast.id)}>
            {toast.message}
          </Text>
        ))}
      </View>
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
