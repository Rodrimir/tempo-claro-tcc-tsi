package com.rodrigo.backend2java.calibracao.model;

import java.util.List;
import java.util.UUID;
import lombok.Builder;
import java.time.LocalTime;

@Builder
public record CalibracaoResponseDTO(
        UUID calibracao_id,
        Integer pontuacao,
        SugestaoDTO sugestao,
        String explicacao) {

    @Builder
    public record SugestaoDTO(
            String categoria,
            String tipo_medida,
            String unidade,
            Integer meta_base,
            Integer meta_maxima,
            Integer incremento,
            Integer dias_incremento,
            Integer meta_frequencia_diaria,
            String frequencia_semanal,
            List<OcorrenciaSugeridaDTO> ocorrencias) {
    }

    @Builder
    public record OcorrenciaSugeridaDTO(
            LocalTime horario_inicio,
            Integer alvo) {
    }
}
