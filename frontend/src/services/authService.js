// @audit-ok: FRONTEND-authService.js-01
export const validateLogin = (formData) => {
  if (!formData.email || !formData.senha) {
    throw new Error('Campos de e-mail ou senha não podem estar vazios.');
  }
};

export const validateRegister = (formData) => {
  if (!formData.nome || !formData.email || !formData.senha) {
    throw new Error('Preencha todos os campos obrigatórios.');
  }
  if (formData.senha !== formData.confirmarSenha) {
    throw new Error('As senhas não conferem. Verifique a digitação.');
  }
};
