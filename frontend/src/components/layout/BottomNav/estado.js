import { ocorrenciaAtiva, horaCurta, minutosAteInicio, MINUTOS_ANTECEDENCIA_LIBERACAO } from '@/utils/ocorrencias';
import { STATUS_HABITO } from '@/model/Status';

export const ESTADOS_DO_BOTAO = {
  CRIAR: 'criar',
  COMECAR: 'comecar',
  AGUARDANDO: 'aguardando',
  FEITO: 'feito',
};

// O botão central muda de cara conforme o hábito em foco: sem hábito, cria um; concluído, mostra
// que está feito; antes de a tarefa abrir (15 min antes do horário), mostra a hora; senão, começa.
export function estadoDoBotaoCentral(habito, agora = new Date()) {
  if (!habito) return { tipo: ESTADOS_DO_BOTAO.CRIAR };
  if (habito.status === STATUS_HABITO.COMPLETED) return { tipo: ESTADOS_DO_BOTAO.FEITO };
  const ativa = ocorrenciaAtiva(habito);
  if (ativa && minutosAteInicio(ativa, agora) > MINUTOS_ANTECEDENCIA_LIBERACAO) {
    return { tipo: ESTADOS_DO_BOTAO.AGUARDANDO, hora: horaCurta(ativa.horario_inicio) };
  }
  return { tipo: ESTADOS_DO_BOTAO.COMECAR };
}
