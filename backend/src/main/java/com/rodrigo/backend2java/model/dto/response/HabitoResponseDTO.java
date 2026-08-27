package com.rodrigo.backend2java.model.dto.response;
import java.util.UUID;
import lombok.Builder;
import java.time.LocalTime;
import java.time.OffsetDateTime;
@Builder
public record HabitoResponseDTO(
        UUID id,
        String titulo,
        String categoria,
        String tipo_medida,
        String modalidade,
        LocalTime horario_agendado,
        Integer meta_base,
        Integer meta_frequencia_diaria,
        Integer intervalo_minutos,
        Boolean ativo,
        Integer moedas_locais,
        Integer bloqueios_acumulados,
        Integer dias_seguidos,
        Integer execucoes_hoje,
        OffsetDateTime proximo_vencimento,
        Boolean bloqueio_usado_hoje,
        // @audit-ok [E1.1 — COMPLETED/PENDING, direto de vw_habito_hoje.status_hoje.
        // Campo novo, adicionado no fim do record para não mexer na ordem dos 16
        // campos existentes.]
        String status) {
}
