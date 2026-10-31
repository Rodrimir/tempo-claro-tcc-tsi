export const LARGURA_MAXIMA = 420;
export const LARGURA_PARA_EMPILHAR = 360;

// Medidas do diálogo para a tela atual: 16 px de margem dos lados, no máximo 420 px de largura e
// 85% da altura útil, com rolagem interna quando o conteúdo passa disso. Em telas estreitas os
// botões ficam empilhados.
export function medidasDoDialogo(largura, altura, insets = { top: 0, bottom: 0 }) {
  return {
    largura: Math.min(largura - 32, LARGURA_MAXIMA),
    alturaMaxima: Math.floor((altura - insets.top - insets.bottom) * 0.85),
    empilharBotoes: largura < LARGURA_PARA_EMPILHAR,
  };
}
