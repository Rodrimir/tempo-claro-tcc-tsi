package com.rodrigo.backend2java.execucao.model;
import lombok.Builder;
import java.util.UUID;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

@Builder
public record ExecutionRequestDTO(
        @NotNull(message = "{validacao.execucao.token}") UUID execution_token,

        String tipo,

        @NotNull(message = "{validacao.execucao.valorObrigatorio}") @Min(value = 0, message = "{validacao.execucao.valorNegativo}") Integer valor_realizado) {
}
