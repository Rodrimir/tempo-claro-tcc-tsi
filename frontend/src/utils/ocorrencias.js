import { STATUS_OCORRENCIA } from '@/model/Status';

export function isDiaProgramado(frequenciaSemanal, data) {
  if (!frequenciaSemanal || frequenciaSemanal.length !== 7) return true;
  return frequenciaSemanal[data.getDay()] === '1';
}

export function ocorrenciaAtiva(habit) {
  return habit?.ocorrencias?.find((o) => o.status === STATUS_OCORRENCIA.ATIVA) || null;
}

export function horaCurta(valor) {
  return valor ? String(valor).slice(0, 5) : '';
}

export function minutosAteInicio(ocorrencia, agora = new Date()) {
  if (!ocorrencia?.horario_inicio) return 0;
  const [h, m] = ocorrencia.horario_inicio.split(':').map(Number);
  const inicioHoje = new Date(agora);
  inicioHoje.setHours(h, m, 0, 0);
  return Math.round((inicioHoje - agora) / 60000);
}

export const MINUTOS_ANTECEDENCIA_LIBERACAO = 15;
