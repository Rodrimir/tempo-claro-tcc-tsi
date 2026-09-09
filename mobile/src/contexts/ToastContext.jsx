import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { DeviceEventEmitter, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SlideInRight, FadeOut } from 'react-native-reanimated';
import { ToastContainer, ToastMessage, ToastText } from '../components/common/Toast/styles';

const ToastContext = createContext(null);

const EVENTO_TOAST_GLOBAL = 'tempoClaro:toast';

export const ToastProvider = ({ children }) => {
  const insets = useSafeAreaInsets();
  const [toasts, setToasts] = useState([]);

  const dispensarToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'default', duration = 3000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
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
      <ToastContainer pointerEvents="box-none" $insetTop={insets.top}>
        {toasts.map((toast) => (
          <Pressable key={toast.id} onPress={() => dispensarToast(toast.id)}>
            <ToastMessage
              $type={toast.type}
              entering={SlideInRight.duration(300)}
              exiting={FadeOut.duration(300)}
            >
              <ToastText $type={toast.type}>
                {toast.type === 'success' && 'V '}
                {toast.type === 'error' && 'X '}
                {toast.message}
              </ToastText>
            </ToastMessage>
          </Pressable>
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
