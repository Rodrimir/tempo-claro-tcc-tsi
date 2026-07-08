package com.rodrigo.backend.model.dto.request;

import java.util.UUID;
import lombok.Builder;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;

// @audit-ok [Execução(1REQ) — DTO de execução: token de idempotência, tipo e valor realizado; sub_atividade_id opcional (regra 3.8)]

@Builder
public record ExecutionRequestDTO(
        @NotNull(message = "Token de execução é obrigatório") UUID execution_token,
        @NotBlank(message = "O tipo é obrigatório") String tipo,
        @NotNull(message = "O valor realizado é obrigatório") @Min(value = 0, message = "Valor não pode ser negativo") Integer valor_realizado,
        UUID sub_atividade_id) {
}
