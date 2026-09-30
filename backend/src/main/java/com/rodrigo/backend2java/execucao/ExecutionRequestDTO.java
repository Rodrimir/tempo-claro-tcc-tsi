package com.rodrigo.backend2java.execucao;
import lombok.Builder;
import java.util.UUID;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

@Builder
public record ExecutionRequestDTO(
        @NotNull(message = "Token de execução é obrigatório") UUID execution_token,

        String tipo,

        @NotNull(message = "O valor realizado é obrigatório") @Min(value = 0, message = "Valor não pode ser negativo") Integer valor_realizado) {
}
