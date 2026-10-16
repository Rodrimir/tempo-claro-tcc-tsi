package com.rodrigo.backend2java.habito;

import java.util.List;
import java.util.UUID;
import java.time.LocalTime;
import java.util.ArrayList;
import org.springframework.stereotype.Component;
import com.rodrigo.backend2java.habito.model.SubAtividade;
import com.rodrigo.backend2java.infra.exception.ValidacaoException;
import com.rodrigo.backend2java.habito.model.HabitoRequestDTO.OcorrenciaRequestDTO;

@Component
public class GeradorDeOcorrencias {

    private static final int MAX_VEZES_AO_DIA = 12;

    private static final LocalTime HORARIO_PADRAO = LocalTime.of(23, 59);

    List<SubAtividade> gerarSubAtividades(final UUID habitoId, final Integer metaBase,
            final Integer vezesAoDiaRequisitado, final LocalTime horarioAgendado,
            final List<OcorrenciaRequestDTO> ocorrencias) {
        final var vezesAoDia = vezesAoDiaRequisitado != null && vezesAoDiaRequisitado > 0
                ? vezesAoDiaRequisitado
                : 1;

        if (vezesAoDia > MAX_VEZES_AO_DIA) {
            throw new ValidacaoException(
                    "Frequência diária máxima é " + MAX_VEZES_AO_DIA + " vezes ao dia");
        }
        if (metaBase == null || metaBase < vezesAoDia) {
            throw new ValidacaoException(
                    "A meta base deve ser maior ou igual à frequência diária (" + vezesAoDia
                            + "x) para poder repartir a meta entre as ocorrências");
        }

        final var usaOcorrenciasIndividuais = ocorrencias != null && !ocorrencias.isEmpty();
        if (usaOcorrenciasIndividuais) {
            if (ocorrencias.size() != vezesAoDia) {
                throw new ValidacaoException("Informe o horário de cada uma das " + vezesAoDia
                        + " ocorrências do dia: foram recebidas " + ocorrencias.size() + ".");
            }
            for (var i = 0; i < ocorrencias.size(); i++) {
                if (ocorrencias.get(i).horario_inicio() == null) {
                    throw new ValidacaoException("Informe o horário de início da ocorrência " + (i + 1) + ".");
                }
            }
        } else if (vezesAoDia > 1 && horarioAgendado == null) {
            throw new ValidacaoException(
                    "Informe o horário de execução (obrigatório com mais de 1 vez ao dia)");
        }

        final var horarioUnico = horarioAgendado != null ? horarioAgendado : HORARIO_PADRAO;
        final var alvoBase = metaBase / vezesAoDia;
        final var resto = metaBase % vezesAoDia;

        final var subAtividades = new ArrayList<SubAtividade>();
        for (var ordem = 1; ordem <= vezesAoDia; ordem++) {
            final var alvo = alvoBase + (ordem == vezesAoDia ? resto : 0);
            final var construtor = SubAtividade.builder()
                    .id(UUID.randomUUID())
                    .habitoId(habitoId)
                    .ordem(ordem)
                    .alvo(alvo);
            if (usaOcorrenciasIndividuais) {
                final var ocorrencia = ocorrencias.get(ordem - 1);
                construtor.horarioInicio(ocorrencia.horario_inicio())
                        .horarioFim(ocorrencia.horario_fim());
            } else {
                construtor.horarioInicio(horarioUnico);
            }
            subAtividades.add(construtor.build());
        }

        final var soma = subAtividades.stream().mapToInt(SubAtividade::getAlvo).sum();
        if (soma != metaBase) {
            throw new IllegalStateException(
                    "Soma das sub_atividades (" + soma + ") não confere com a meta base ("
                            + metaBase + ")");
        }

        return subAtividades;
    }
}
