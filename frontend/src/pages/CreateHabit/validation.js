import { RE_HORA } from '@/utils/validacao';
import { NOME_MAX_LENGTH, MAX_VEZES_AO_DIA } from '@/model/Habito';

export function validarFormulario(formData, t) {
  const erros = {};

  if (!formData.titulo.trim()) {
    erros.titulo = t('criar.erroNome');
  } else if (formData.titulo.length > NOME_MAX_LENGTH) {
    erros.titulo = t('criar.erroNomeMaximo', { max: NOME_MAX_LENGTH });
  }

  const metaBaseNum = formData.meta_base === '' ? NaN : Number(formData.meta_base);
  if (formData.meta_base === '' || !Number.isFinite(metaBaseNum) || metaBaseNum < 1) {
    erros.meta_base = t('criar.erroMeta');
  }

  const vezesDiaNum = formData.vezes_dia === '' ? NaN : Number(formData.vezes_dia);
  if (formData.vezes_dia === '' || !Number.isFinite(vezesDiaNum) || vezesDiaNum < 1 || vezesDiaNum > MAX_VEZES_AO_DIA) {
    erros.vezes_dia = t('criar.erroVezes');
  }

  if (formData.frequencia_semanal.length === 0) {
    erros.frequencia_semanal = t('criar.erroDia');
  }

  if (vezesDiaNum <= 1 && formData.horario && !RE_HORA.test(formData.horario)) {
    erros.horario = t('criar.erroHora');
  }

  if (vezesDiaNum > 1) {
    formData.ocorrencias.forEach((ocorrencia, i) => {
      if (!ocorrencia.horario_inicio) {
        erros[`ocorrencia_${i}`] = t('criar.erroInicioOcorrencia', { n: i + 1 });
      } else if (!RE_HORA.test(ocorrencia.horario_inicio)) {
        erros[`ocorrencia_${i}`] = t('criar.erroHora');
      } else if (ocorrencia.horario_fim && !RE_HORA.test(ocorrencia.horario_fim)) {
        erros[`ocorrencia_${i}`] = t('criar.erroHora');
      }
    });
  }

  if (formData.meta_maxima !== '') {
    const metaMaximaNum = Number(formData.meta_maxima);
    if (Number.isFinite(metaBaseNum) && metaMaximaNum < metaBaseNum) {
      erros.meta_maxima = t('criar.erroTeto');
    }
  }

  return erros;
}
