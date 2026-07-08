package com.rodrigo.backend.model.dto.response;

import java.time.LocalDate;

// @audit-ok [Estatísticas(1RES) — DTO de um dia na semana: status, valor acumulado e meta do dia]

public record DiaSemanalDTO(
        LocalDate data,
        String status,
        Integer valorTotalDia,
        Integer metaDoDia) {
}
