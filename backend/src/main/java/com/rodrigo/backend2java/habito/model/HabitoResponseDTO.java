package com.rodrigo.backend2java.habito.model;
import java.util.List;
import java.util.UUID;
import lombok.Builder;
import java.time.LocalTime;
import java.time.OffsetDateTime;

@Builder(toBuilder = true)
public record HabitoResponseDTO(
        UUID id,
        String titulo,
        String categoria,
        String tipo_medida,
        Integer meta_base,
        Integer meta_frequencia_diaria,
        Boolean ativo,
        Integer moedas_locais,
        Integer bloqueios_acumulados,
        Integer dias_seguidos,
        Integer execucoes_hoje,
        Integer valor_acumulado_hoje,
        OffsetDateTime proximo_vencimento,
        Boolean bloqueio_usado_hoje,

        String status,

        Integer meta_maxima,
        Integer incremento,
        Integer dias_incremento,

        String frequencia_semanal,

        Integer alvo_ocorrencia_atual,
        LocalTime horario_ocorrencia_atual,

        String gatilho_ancora,

        Integer nivel_avatar,

        List<OcorrenciaResponseDTO> ocorrencias) {

    @Builder
    public record OcorrenciaResponseDTO(
            LocalTime horario_inicio,
            LocalTime horario_fim,
            Integer alvo,
            String status) {
    }
}
