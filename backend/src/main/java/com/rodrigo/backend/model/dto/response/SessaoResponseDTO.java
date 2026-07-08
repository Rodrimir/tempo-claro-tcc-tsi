package com.rodrigo.backend.model.dto.response;

import java.util.UUID;
import java.time.OffsetDateTime;

// @audit-ok [Execução(1RES) — DTO de sessão: estado atual, valor parcial acumulado e instantes de início/pausa/expiração]

public record SessaoResponseDTO(
        UUID id,
        UUID habitoId,
        UUID subAtividadeId,
        OffsetDateTime iniciadaEm,
        OffsetDateTime pausadaEm,
        Integer valorParcial,
        String estado,
        OffsetDateTime expiraEm) {
}
