package com.rodrigo.backend.model.dto.request;

// @audit-ok [Execução(1REQ) — DTO de pausa: valor acumulado pelo timer do cliente até o momento da pausa]

public record SessaoPausaRequestDTO(Integer valor_parcial) {
}
