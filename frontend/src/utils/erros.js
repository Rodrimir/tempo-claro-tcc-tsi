import { traduzir, IDIOMA_PADRAO } from '@/i18n';

let idiomaAtual = IDIOMA_PADRAO;

export function definirIdiomaDosErros(idioma) {
  idiomaAtual = idioma;
}

function traduzirPorStatus(status) {
  switch (status) {
    case 400:
      return traduzir(idiomaAtual, 'comum.erroValidacao');
    case 401:
      return traduzir(idiomaAtual, 'comum.erroCredencial');
    case 403:
      return traduzir(idiomaAtual, 'comum.sessaoExpirada');
    case 404:
      return traduzir(idiomaAtual, 'comum.erroNaoEncontrado');
    case 422:
      return traduzir(idiomaAtual, 'comum.erroRegraDeNegocio');
    default:
      return status >= 500 ? traduzir(idiomaAtual, 'comum.erroServidor') : null;
  }
}

export function getApiErrorMessage(err, mensagemPadrao) {
  const doServidor = err?.response?.data?.message;
  if (doServidor) return doServidor;

  if (!err?.response) {
    return traduzir(idiomaAtual, 'comum.erroSemResposta');
  }

  return traduzirPorStatus(err.response.status) || mensagemPadrao;
}
