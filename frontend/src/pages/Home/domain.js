import { isDiaProgramado, ocorrenciaAtiva, horaCurta, minutosAteInicio, MINUTOS_ANTECEDENCIA_LIBERACAO } from '@/utils/ocorrencias';
import { STATUS_OCORRENCIA, STATUS_HABITO } from '@/model/Status';
import { Categoria } from '@/model/Categoria';
import { TipoMedida } from '@/model/TipoMedida';

export const ICONE_POR_STATUS = { [STATUS_OCORRENCIA.FEITO]: 'check-circle', [STATUS_OCORRENCIA.FALHOU]: 'x-circle' };

export function unidadeDoHabito(habit, t) {
  if (habit.tipo_medida === TipoMedida.TEMPO) return t('comum.min');
  return habit.categoria === Categoria.AGUA ? t('comum.ml') : t('comum.vezes');
}

export function getAvatarExpression(habit, agora = new Date()) {
  if (habit.status === STATUS_HABITO.COMPLETED) return 'feliz';
  if (!isDiaProgramado(habit.frequencia_semanal, agora)) return 'normal';

  const ativa = ocorrenciaAtiva(habit);
  if (!ativa) {
    const teveFalha = habit.ocorrencias?.some((o) => o.status === STATUS_OCORRENCIA.FALHOU);
    return teveFalha ? 'falha' : 'normal';
  }

  const faltam = minutosAteInicio(ativa, agora);
  if (faltam > MINUTOS_ANTECEDENCIA_LIBERACAO) return 'normal';
  if (faltam > 0) return 'preocupado';
  return 'desesperado';
}

export function tempoRestante(habit, agora, t) {
  if (habit.status === STATUS_HABITO.COMPLETED || !isDiaProgramado(habit.frequencia_semanal, agora)) return null;

  const ativa = ocorrenciaAtiva(habit);
  if (!ativa) return null;

  const faltamParaLiberar = minutosAteInicio(ativa, agora);
  if (faltamParaLiberar > MINUTOS_ANTECEDENCIA_LIBERACAO) {
    return { texto: t('home.programadaPara', { hora: horaCurta(ativa.horario_inicio) }), atrasado: false, programada: true };
  }

  const minutos = faltamParaLiberar;
  const abs = Math.abs(minutos);
  const horas = Math.floor(abs / 60);
  const min = abs % 60;

  let quanto;
  if (abs < 1) quanto = t('home.menosDeUmMin');
  else if (horas === 0) quanto = `${min} ${t('comum.min')}`;
  else if (min === 0) quanto = `${horas}h`;
  else quanto = `${horas}h ${min}${t('comum.min')}`;

  return minutos >= 0
    ? { texto: t('home.faltam', { tempo: quanto }), atrasado: false }
    : { texto: t('home.atrasado', { tempo: quanto }), atrasado: true };
}

export function corDaOcorrencia(status, completed, theme) {
  if (completed) return 'rgba(255,255,255,0.85)';
  if (status === STATUS_OCORRENCIA.FEITO) return theme.successColor;
  if (status === STATUS_OCORRENCIA.ATIVA) return theme.primaryColor;
  return theme.textSecondary;
}
