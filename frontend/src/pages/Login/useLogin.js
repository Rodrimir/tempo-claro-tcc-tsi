import { useState } from 'react';
import { validateLogin, validateRegister } from '../../services/authService';

// @audit-ok [useLogin — orquestra validação local e chamada ao AuthContext para login e cadastro]

export const useLogin = (loginFn, registerFn) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // @audit-ok [Login (3) / Cadastro (3) — ponto de entrada unificado para autenticação]
  const executeAuth = async (isLogin, data) => {
    setIsSubmitting(true);
    try {
      if (isLogin) {
        // @audit-ok [Login (4) — valida campos antes de chamar a API]
        validateLogin(data);
        await loginFn(data);
      } else {
        // @audit-ok [Cadastro (4) — valida campos e confirmação de senha]
        validateRegister(data);
        await registerFn(data);
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || err.message || 'Erro ao autenticar. Tente novamente.' };
    } finally {
      setIsSubmitting(false);
    }
  };

  return { isSubmitting, executeAuth };
};
