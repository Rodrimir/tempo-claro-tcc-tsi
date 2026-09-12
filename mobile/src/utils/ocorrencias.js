/**
 * A ocorrência liberada agora — a API já manda o status calculado
 * (FEITO/FALHOU/ATIVA/PENDENTE, ver ProximoVencimentoService no backend).
 */
export function ocorrenciaAtiva(habit) {
  return habit?.ocorrencias?.find((o) => o.status === 'ATIVA') || null;
}

/** "HH:mm:ss" (formato do LocalTime do Java) vira "HH:mm". */
export function horaCurta(valor) {
  return valor ? String(valor).slice(0, 5) : '';
}

/** Minutos até o horário de início da ocorrência hoje (negativo se já passou). */
export function minutosAteInicio(ocorrencia, agora = new Date()) {
  if (!ocorrencia?.horario_inicio) return 0;
  const [h, m] = ocorrencia.horario_inicio.split(':').map(Number);
  const inicioHoje = new Date(agora);
  inicioHoje.setHours(h, m, 0, 0);
  return Math.round((inicioHoje - agora) / 60000);
}

// A tarefa só libera 15 minutos antes do horário programado — antes disso o
// Play não deveria nem abrir o Pré-Tarefa.
export const MINUTOS_ANTECEDENCIA_LIBERACAO = 15;

export function estaLiberada(ocorrencia, agora = new Date()) {
  if (!ocorrencia) return true;
  return minutosAteInicio(ocorrencia, agora) <= MINUTOS_ANTECEDENCIA_LIBERACAO;
}
