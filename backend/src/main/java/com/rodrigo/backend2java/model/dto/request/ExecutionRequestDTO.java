// @audit-ok: BACKEND-ExecutionRequestDTO.java-01
package com.rodrigo.backend2java.model.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;
import lombok.Builder;

@Builder
public record ExecutionRequestDTO(
    @NotNull(message = "Token de execução é obrigatório")
    UUID execution_token,
    
    @NotBlank(message = "O tipo é obrigatório")
    String tipo,
    
    @NotNull(message = "O valor realizado é obrigatório")
    @Min(value = 0, message = "Valor não pode ser negativo")
    Integer valor_realizado
) {}
