// @audit-ok: FRONTEND-useLogin.js-01
import { useState } from 'react';
import { validateLogin, validateRegister } from '../../services/authService';

export const useLogin = (loginFn, registerFn) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const executeAuth = async (isLogin, data) => {
    setIsSubmitting(true);
    
    try {
      if (isLogin) {
        validateLogin(data);
        await loginFn(data);
      } else {
        validateRegister(data);
        await registerFn(data);
      }
      return { success: true };
    } catch (err) {
      console.error("DEBUG ERROR:", err);
      console.error("DEBUG ERR.RESPONSE:", err.response);
      return { success: false, error: err.response?.data?.message || err.message || 'Erro ao autenticar. Tente novamente.' };
    } finally {
      setIsSubmitting(false);
    }
  };

  return { isSubmitting, executeAuth };
};
