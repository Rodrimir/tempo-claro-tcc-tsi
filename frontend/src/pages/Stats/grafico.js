// Regras do gráfico de desempenho, separadas da tela para poderem ser testadas.

export const ESTADOS_DO_DIA = {
  CUMPRIDA: 'cumprida',
  PARCIAL: 'parcial',
  SEM_EXECUCAO: 'semExecucao',
  FOLGA: 'folga',
  ANTES: 'antes',
  DISPENSADO: 'dispensado',
};

// O que cada barra representa. A ordem importa: um dia antes do hábito existir não é "sem
// execução", e um dia de folga também não.
export function estadoDoDia(dia) {
  if (dia.antes_da_criacao) return ESTADOS_DO_DIA.ANTES;
  if (dia.dispensado) return ESTADOS_DO_DIA.DISPENSADO;
  if (dia.meta_cumprida) return ESTADOS_DO_DIA.CUMPRIDA;
  if (dia.parcial || dia.valor_realizado > 0) return ESTADOS_DO_DIA.PARCIAL;
  if (dia.dia_programado === false) return ESTADOS_DO_DIA.FOLGA;
  return ESTADOS_DO_DIA.SEM_EXECUCAO;
}

// Topo do eixo: a meta sempre aparece, com 15% de folga acima do maior valor ou da meta.
export function topoDoGrafico(dias, meta) {
  const maior = Math.max(0, ...dias.map((d) => d.valor_realizado || 0));
  return Math.max(1, Math.ceil(Math.max(maior, meta || 0) * 1.15));
}

// "12/10" em português, "10/12" em inglês.
export function dataCurta(iso, idioma) {
  const [, mes, dia] = iso.split('-');
  return idioma === 'en-US' ? `${mes}/${dia}` : `${dia}/${mes}`;
}

export function diaDaSemana(iso) {
  const [ano, mes, dia] = iso.split('-').map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay();
}

// Quais barras ganham rótulo embaixo: todas em 7 dias; de 5 em 5 em 30, sempre com a de hoje.
export function mostrarRotulo(indice, total) {
  if (total <= 10) return true;
  return indice === total - 1 || (total - 1 - indice) % 5 === 0;
}
