package com.rodrigo.backend.model.dto.response;

import lombok.Builder;

// @audit-ok [Execução(1RES) — DTO de resposta: moedas ganhas, saldo, streak, nível, escudos e feedback textual (F13)]

@Builder
public record ExecutionResponseDTO(
        Integer moedas_ganhas,
        Integer moedas_totais,
        Integer dias_seguidos,
        Integer novo_nivel,
        Integer escudos_disponiveis,
        Integer valor_total_dia,
        Integer meta_do_dia,
        Boolean meta_concluida_hoje,
        String texto_feedback) {
}
