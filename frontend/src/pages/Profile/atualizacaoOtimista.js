import { getApiErrorMessage } from '@/utils/erros';

export function criarAtualizadorOtimista(addToast) {
  return async function atualizarComRollback({ valorAtual, valorNovo, setter, chamadaApi, aoSucesso, mensagemErroPadrao }) {
    setter(valorNovo);
    try {
      await chamadaApi();
      aoSucesso?.();
    } catch (err) {
      setter(valorAtual);
      addToast(getApiErrorMessage(err, mensagemErroPadrao), 'error');
    }
  };
}
