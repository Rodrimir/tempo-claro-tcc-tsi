import { horaCurta } from '@/utils/ocorrencias';
import { Categoria } from '@/model/Categoria';

export const MOLDES = [
  { id: Categoria.AGUA, emoji: '💧', chave: Categoria.AGUA },
  { id: Categoria.ESTUDO, emoji: '📚', chave: Categoria.ESTUDO },
  { id: Categoria.EXERCICIO, emoji: '🏋️', chave: Categoria.EXERCICIO },
  { id: null, emoji: '🔒', chave: 'RESERVADO' },
];

export const SOM_DO_MOLDE = {
  [Categoria.AGUA]: 'moldeAgua',
  [Categoria.ESTUDO]: 'moldeEstudo',
  [Categoria.EXERCICIO]: 'moldeExercicio',
};

export const TOTAL_STEPS = 4;

export function diasDaMascara(mascara) {
  if (!mascara) return [1, 2, 3, 4, 5];
  return [...mascara].reduce((acc, c, i) => (c === '1' ? [...acc, i] : acc), []);
}

export function formDataDaSugestao(sugestao, tituloPadrao) {
  const vezes = sugestao.meta_frequencia_diaria || 1;
  return {
    titulo: tituloPadrao,
    gatilho_ancora: '',
    meta_base: String(sugestao.meta_base),
    incremento: String(sugestao.incremento ?? 0),
    dias_incremento: String(sugestao.dias_incremento ?? 10),
    meta_maxima: sugestao.meta_maxima != null ? String(sugestao.meta_maxima) : '',
    frequencia_semanal: diasDaMascara(sugestao.frequencia_semanal),
    vezes_dia: String(vezes),
    horario: vezes <= 1 ? horaCurta(sugestao.ocorrencias?.[0]?.horario_inicio) : '',
    ocorrencias:
      vezes > 1
        ? sugestao.ocorrencias.map((o) => ({ horario_inicio: horaCurta(o.horario_inicio), horario_fim: '' }))
        : [{ horario_inicio: '', horario_fim: '' }],
  };
}

// Na edição, se já houver uma alteração esperando o dia seguinte, o formulário abre com ela: é o
// que vai valer amanhã.
function comAlteracaoPendente(habito) {
  const pendente = habito?.alteracao_pendente;
  if (!pendente) return habito;
  const vezes = pendente.meta_frequencia_diaria || 1;
  return {
    ...habito,
    meta_base: pendente.meta_base,
    meta_maxima: pendente.meta_maxima,
    incremento: pendente.incremento,
    dias_incremento: pendente.dias_incremento,
    frequencia_semanal: pendente.frequencia_semanal,
    meta_frequencia_diaria: vezes,
    horario_ocorrencia_atual: vezes <= 1 ? pendente.ocorrencias?.[0]?.horario_inicio || pendente.horario_agendado : null,
    ocorrencias: pendente.ocorrencias || [],
  };
}

export function formDataInicial(habitoEditado, tituloPadrao) {
  const editHabit = comAlteracaoPendente(habitoEditado);
  if (!editHabit) {
    return {
      titulo: tituloPadrao,
      gatilho_ancora: '',
      meta_base: '',
      incremento: '',
      dias_incremento: '10',
      meta_maxima: '',
      frequencia_semanal: [1, 2, 3, 4, 5],
      vezes_dia: '1',
      horario: '',
      ocorrencias: [{ horario_inicio: '', horario_fim: '' }],
    };
  }
  const vezesDia = editHabit.meta_frequencia_diaria || 1;
  return {
    titulo: editHabit.titulo || tituloPadrao,
    gatilho_ancora: editHabit.gatilho_ancora || '',
    meta_base: editHabit.meta_base != null ? String(editHabit.meta_base) : '',
    incremento: editHabit.incremento != null ? String(editHabit.incremento) : '',
    dias_incremento: editHabit.dias_incremento != null ? String(editHabit.dias_incremento) : '10',
    meta_maxima: editHabit.meta_maxima != null ? String(editHabit.meta_maxima) : '',
    frequencia_semanal: diasDaMascara(editHabit.frequencia_semanal),
    vezes_dia: String(vezesDia),
    horario: vezesDia <= 1 ? horaCurta(editHabit.horario_ocorrencia_atual) : '',
    ocorrencias:
      vezesDia > 1 && editHabit.ocorrencias?.length
        ? editHabit.ocorrencias.map((o) => ({
            horario_inicio: horaCurta(o.horario_inicio),
            horario_fim: horaCurta(o.horario_fim),
          }))
        : Array.from({ length: Math.max(1, vezesDia) }, () => ({ horario_inicio: '', horario_fim: '' })),
  };
}

export function calcularAlvos(metaBase, vezes) {
  const meta = Number(metaBase) || 0;
  const n = Math.max(1, Number(vezes) || 1);
  const base = Math.floor(meta / n);
  const resto = meta % n;
  return Array.from({ length: n }, (_, i) => base + (i === n - 1 ? resto : 0));
}

export function moldeDe(alvo) {
  return alvo ? MOLDES.find((m) => m.id === alvo.categoria) || MOLDES[0] : MOLDES[0];
}

// A configuração de execução editada só vale amanhã (título e gatilho mudam na hora). Diz se o
// envio muda algo além do título e do gatilho, para o aviso depois de salvar.
export function mudaSoAmanha(habito, payload) {
  if (!habito) return false;
  if (habito.alteracao_pendente) return true;
  const horas = (lista) => (lista || []).map((o) => `${horaCurta(o.horario_inicio)}|${horaCurta(o.horario_fim)}`).join(';');
  const vezes = payload.meta_frequencia_diaria || 1;
  const horariosAtuais = vezes > 1 ? horas(habito.ocorrencias) : horaCurta(habito.horario_ocorrencia_atual);
  const horariosNovos = vezes > 1 ? horas(payload.ocorrencias) : horaCurta(payload.horario_agendado) || '23:59';
  return (
    habito.meta_base !== payload.meta_base ||
    (habito.meta_maxima ?? null) !== (payload.meta_maxima ?? null) ||
    (habito.incremento ?? 0) !== (payload.incremento ?? 0) ||
    (habito.dias_incremento ?? 10) !== (payload.dias_incremento ?? 10) ||
    habito.frequencia_semanal !== payload.frequencia_semanal ||
    (habito.meta_frequencia_diaria || 1) !== vezes ||
    horariosAtuais !== horariosNovos
  );
}
