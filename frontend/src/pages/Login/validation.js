import * as yup from 'yup';

export const TAMANHO_MINIMO_SENHA = 8;
export const RE_MAIUSCULA = /[A-Z]/;
export const RE_ESPECIAL = /[^A-Za-z0-9]/;

export const criarLoginSchema = (t) =>
  yup.object({
    email: yup
      .string()
      .email(t('validacao.emailInvalido'))
      .required(t('validacao.campoObrigatorio')),
    senha: yup.string().required(t('validacao.campoObrigatorio')),
  });

export const criarRegisterSchema = (t) =>
  yup.object({
    nome: yup.string().required(t('validacao.preenchaTudo')),
    email: yup
      .string()
      .email(t('validacao.emailInvalido'))
      .required(t('validacao.preenchaTudo')),
    senha: yup
      .string()
      .required(t('validacao.preenchaTudo'))
      .min(TAMANHO_MINIMO_SENHA, t('validacao.senhaCurta', { minimo: TAMANHO_MINIMO_SENHA }))
      .matches(RE_MAIUSCULA, t('validacao.senhaSemMaiuscula'))
      .matches(RE_ESPECIAL, t('validacao.senhaSemEspecial')),
    confirmarSenha: yup
      .string()
      .oneOf([yup.ref('senha')], t('validacao.senhasNaoConferem')),
  });
