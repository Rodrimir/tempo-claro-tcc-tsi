import * as yup from 'yup';

/**
 * O backend recusa senha com menos de 8 caracteres na troca (UsuarioService).
 * Validar aqui também é o que faz o usuário descobrir isso enquanto digita, em
 * vez de só depois do erro do servidor.
 */
export const TAMANHO_MINIMO_SENHA = 8;

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
      .min(TAMANHO_MINIMO_SENHA, t('validacao.senhaCurta', { minimo: TAMANHO_MINIMO_SENHA })),
    confirmarSenha: yup
      .string()
      .oneOf([yup.ref('senha')], t('validacao.senhasNaoConferem')),
  });
