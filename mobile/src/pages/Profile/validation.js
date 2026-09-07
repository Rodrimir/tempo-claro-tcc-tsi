import * as yup from 'yup';

const TAMANHO_MINIMO_SENHA = 8;

export const profileSchema = yup.object({
  nome: yup.string(),
  fusoHorario: yup.string(),
  senhaAtual: yup.string().when('novaSenha', {
    is: (val) => Boolean(val),
    then: (schema) => schema.required('Informe a senha atual para alterar a senha.'),
  }),
  novaSenha: yup
    .string()
    .when('senhaAtual', {
      is: (val) => Boolean(val),
      then: (schema) => schema.required('Preencha a nova senha para concluir a alteração.'),
    })
    .test(
      'tamanho-minimo',
      `A nova senha deve ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`,
      (val) => !val || val.length >= TAMANHO_MINIMO_SENHA
    ),
  confirmarNovaSenha: yup.string().when('novaSenha', {
    is: (val) => Boolean(val),
    then: (schema) => schema.oneOf([yup.ref('novaSenha')], 'A confirmação não corresponde à nova senha.'),
  }),
});
