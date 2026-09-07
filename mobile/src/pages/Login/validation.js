import * as yup from 'yup';

const MSG_LOGIN = 'Campos de e-mail ou senha não podem estar vazios.';
const MSG_CADASTRO_CAMPOS = 'Preencha todos os campos obrigatórios.';
const MSG_CADASTRO_SENHA = 'As senhas não conferem. Verifique a digitação.';

export const loginSchema = yup.object({
  email: yup.string().email(MSG_LOGIN).required(MSG_LOGIN),
  senha: yup.string().required(MSG_LOGIN),
});

export const registerSchema = yup.object({
  nome: yup.string().required(MSG_CADASTRO_CAMPOS),
  email: yup.string().email(MSG_CADASTRO_CAMPOS).required(MSG_CADASTRO_CAMPOS),
  senha: yup.string().required(MSG_CADASTRO_CAMPOS),
  confirmarSenha: yup.string().oneOf([yup.ref('senha')], MSG_CADASTRO_SENHA),
});
