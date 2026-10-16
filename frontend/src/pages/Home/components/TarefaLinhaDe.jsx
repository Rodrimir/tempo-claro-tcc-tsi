import { Feather } from '@expo/vector-icons';
import { horaCurta } from '@/utils/ocorrencias';
import { STATUS_OCORRENCIA } from '@/model/Status';
import { ICONE_POR_STATUS, corDaOcorrencia } from '@/pages/Home/domain';
import { TarefaModalLinha, TarefaColuna, TarefaLabel, TarefaDetalhe } from '@/pages/Home/styles';

export function TarefaLinhaDe({ ocorrencia, rotulo, theme, unidade }) {
  return (
    <TarefaModalLinha>
      <Feather
        name={ICONE_POR_STATUS[ocorrencia.status] || 'circle'}
        size={14}
        color={corDaOcorrencia(ocorrencia.status, false, theme)}
        style={{ marginTop: 2 }}
      />
      <TarefaColuna>
        {rotulo ? (
          <TarefaLabel $ativa={ocorrencia.status === STATUS_OCORRENCIA.ATIVA} $falhou={ocorrencia.status === STATUS_OCORRENCIA.FALHOU}>
            {rotulo}
          </TarefaLabel>
        ) : null}
        <TarefaDetalhe $falhou={ocorrencia.status === STATUS_OCORRENCIA.FALHOU}>
          {horaCurta(ocorrencia.horario_inicio)} · {ocorrencia.alvo} {unidade}
        </TarefaDetalhe>
      </TarefaColuna>
    </TarefaModalLinha>
  );
}
