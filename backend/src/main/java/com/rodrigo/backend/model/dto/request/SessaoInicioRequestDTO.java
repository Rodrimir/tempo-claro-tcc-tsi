package com.rodrigo.backend.model.dto.request;

import java.util.UUID;
import java.time.OffsetDateTime;

// @audit-ok [Execução(1REQ) — DTO de início de sessão; sub_atividade_id e expira_em são opcionais]

public record SessaoInicioRequestDTO(
        UUID sub_atividade_id,
        OffsetDateTime expira_em) {
}
