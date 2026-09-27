import * as yup from 'yup';

export const TAMANHO_MINIMO_SENHA = 8;
// @note - 2.1 (Cadastro) TAMANHO_MAXIMO_NOME espelha o usu_nome VARCHAR(150) do banco (ver
// Usuario.java, item 9.2), para o mesmo limite ser aplicado no cliente (aqui) e no servidor
// (RegisterRequestDTO.java, item 5.1) antes de qualquer violação de restrição de banco.
export const TAMANHO_MAXIMO_NOME = 150;
// @note - 2.1 (Cadastro) TAMANHO_MAXIMO_SENHA espelha SenhaValidator.TAMANHO_MAXIMO (backend,
// item 8.1): não bate com nenhuma coluna do banco (usu_senha_hash guarda só o hash), é um teto
// escolhido pelo autor, abaixo do corte de 72 bytes do BCrypt.
export const TAMANHO_MAXIMO_SENHA = 25;
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

// @note - 2.1 (Cadastro) criarRegisterSchema: regras de nome, email, senha e confirmarSenha
// usadas pelo yupResolver antes de qualquer chamada de rede. Ramificações cobertas: nome vazio ou
// maior que TAMANHO_MAXIMO_NOME; e-mail vazio ou fora do formato; senha vazia, curta, longa (mais
// que TAMANHO_MAXIMO_SENHA), sem maiúscula ou sem caractere especial; confirmação vazia ou
// diferente da senha digitada. Ver README §8 > Cadastro > item 2.
export const criarRegisterSchema = (t) =>
  yup.object({
    // @audit-issue - 2.1 (Cadastro) [outcome: fixed] nome tinha só .required(), sem limite máximo
    // de tamanho, e podia estourar o usu_nome VARCHAR(150) do banco (ver Usuario.java, item 9.2)
    // como um DataIntegrityViolationException (item 13.4) em vez de um erro de formulário. Corrigido
    // com .max(TAMANHO_MAXIMO_NOME), espelhando o @Size adicionado em RegisterRequestDTO.java.
    nome: yup
      .string()
      .required(t('validacao.preenchaTudo'))
      .max(TAMANHO_MAXIMO_NOME, t('validacao.nomeMuitoLongo', { maximo: TAMANHO_MAXIMO_NOME })),
    email: yup
      .string()
      .email(t('validacao.emailInvalido'))
      .required(t('validacao.preenchaTudo')),
    // @audit-info - 2.1 (Cadastro) [outcome: fixed] senha não tinha .max(): uma senha maior que
    // os 72 bytes que o BCrypt considera (SenhaValidator.java, item 8.1) passava validada, mas
    // tinha a cauda descartada na hora de autenticar depois. Corrigido com TAMANHO_MAXIMO_SENHA.
    senha: yup
      .string()
      .required(t('validacao.preenchaTudo'))
      .min(TAMANHO_MINIMO_SENHA, t('validacao.senhaCurta', { minimo: TAMANHO_MINIMO_SENHA }))
      .max(TAMANHO_MAXIMO_SENHA, t('validacao.senhaLonga', { maximo: TAMANHO_MAXIMO_SENHA }))
      .matches(RE_MAIUSCULA, t('validacao.senhaSemMaiuscula'))
      .matches(RE_ESPECIAL, t('validacao.senhaSemEspecial')),
    confirmarSenha: yup
      .string()
      .oneOf([yup.ref('senha')], t('validacao.senhasNaoConferem')),
  });
