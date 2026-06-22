// @audit-ok [Validação de Formulários de Autenticação]

// @audit-ok [Login (4) — valida campos obrigatórios antes de chamar a API]
export const validateLogin = (formData) => {
  if (!formData.email || !formData.senha) {
    throw new Error('Campos de e-mail ou senha não podem estar vazios.');
  }
};

// @audit-ok [Cadastro (4) — valida campos e confirmação de senha antes de chamar a API]
export const validateRegister = (formData) => {
  if (!formData.nome || !formData.email || !formData.senha) {
    throw new Error('Preencha todos os campos obrigatórios.');
  }
  if (formData.senha !== formData.confirmarSenha) {
    throw new Error('As senhas não conferem. Verifique a digitação.');
  }
};
