package com.rodrigo.backend.model.dto.response;

import java.util.List;
import java.util.UUID;

// @audit-ok [Estatísticas(1RES) — DTO semanal por hábito: 7 dias com status e recorde de execução]

public record StatsWeeklyResponseDTO(
        UUID habitoId,
        String titulo,
        List<DiaSemanalDTO> dias,
        Integer recordValor) {
}
