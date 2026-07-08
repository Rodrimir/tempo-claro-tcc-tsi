package com.rodrigo.backend.model.dto.response;

import lombok.Builder;

// @audit-ok [Erros(1RES) model response — corpo padronizado de erro { success, message } retornado pelo GlobalExceptionHandler]

@Builder
public record MessageResponseDTO(
        boolean success,
        String message) {
}
