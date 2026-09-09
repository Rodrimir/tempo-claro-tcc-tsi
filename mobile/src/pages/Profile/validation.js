import * as yup from 'yup';

const TAMANHO_MINIMO_SENHA = 8;

export const profileSchema = yup.object({
  nome: yup.string(),
  fusoHorario: yup.string(),
  senhaAtual: yup.string().test(
    'senha-atual-obrigatoria',
    'Informe a senha atual para alterar a senha.',
    function (val) {
      return !this.parent.novaSenha || Boolean(val);
    }
  ),
  novaSenha: yup
    .string()
    .test(
      'nova-senha-obrigatoria',
      'Preencha a nova senha para concluir a alteração.',
      function (val) {
        return !this.parent.senhaAtual || Boolean(val);
      }
    )
    .test(
      'tamanho-minimo',
      `A nova senha deve ter pelo menos ${TAMANHO_MINIMO_SENHA} caracteres.`,
      (val) => !val || val.length >= TAMANHO_MINIMO_SENHA
    ),
  confirmarNovaSenha: yup.string().test(
    'confirmacao-bate',
    'A confirmação não corresponde à nova senha.',
    function (val) {
      return !this.parent.novaSenha || val === this.parent.novaSenha;
    }
  ),
});
