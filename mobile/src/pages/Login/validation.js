import * as yup from 'yup';

/**
 * Mesma regra de SenhaValidator.java (backend/infra/util) — 3 exigências, não
 * só tamanho. Duplicado aqui de propósito (front não importa Java): validar
 * aqui é o que faz a pessoa descobrir o que falta enquanto digita, em vez de
 * só depois de um 422 do servidor. As DUAS pontas precisam mudar juntas se a
 * regra mudar — não existe um jeito de compartilhar isso entre Kotlin/Java e
 * JS neste projeto.
 */
export const TAMANHO_MINIMO_SENHA = 8;
export const RE_MAIUSCULA = /[A-Z]/;
export const RE_ESPECIAL = /[^A-Za-z0-9]/;

/**
 * Os schemas são FUNÇÕES, não constantes de módulo: as mensagens precisam sair no
 * idioma escolhido, e o idioma só é conhecido dentro do componente. `useMemo` no
 * Login evita reconstruí-los a cada render.
 */
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
