import { STATUS_OCORRENCIA } from '@/model/Status';
import { partesNoFuso } from '@/utils/fuso';

export function isDiaDaSemanaProgramado(frequenciaSemanal, diaDaSemana) {
  if (!frequenciaSemanal || frequenciaSemanal.length !== 7) return true;
  return frequenciaSemanal[diaDaSemana] === '1';
}

export function isDiaProgramado(frequenciaSemanal, data) {
  return isDiaDaSemanaProgramado(frequenciaSemanal, partesNoFuso(data).diaDaSemana);
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
  const relogio = partesNoFuso(agora);
  const segundosAgora = relogio.hora * 3600 + relogio.minuto * 60 + relogio.segundo;
  return Math.round((h * 3600 + m * 60 - segundosAgora) / 60);
}

export const MINUTOS_ANTECEDENCIA_LIBERACAO = 15;
