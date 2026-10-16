import { Feather } from '@expo/vector-icons';
import { horaCurta } from '@/utils/ocorrencias';
import { ICONE_POR_STATUS, corDaOcorrencia } from '@/pages/Home/domain';
import { TarefaLinha, TarefaResumoTexto } from '@/pages/Home/styles';

export function TarefaResumo({ ocorrencia, rotulo, completed, theme, unidade }) {
  return (
    <TarefaLinha>
      <Feather
        name={ICONE_POR_STATUS[ocorrencia.status] || 'circle'}
        size={14}
        color={corDaOcorrencia(ocorrencia.status, completed, theme)}
      />
      <TarefaResumoTexto $completed={completed}>
        {rotulo ? `${rotulo} · ` : ''}
        {horaCurta(ocorrencia.horario_inicio)} · {ocorrencia.alvo} {unidade}
      </TarefaResumoTexto>
    </TarefaLinha>
  );
}
