package com.rodrigo.backend.model.dto.response;

import lombok.Builder;

// @audit-ok [Priming(1RES) — DTO de resposta do priming: texto motivacional pré-tarefa]

@Builder
public record PrimingResponseDTO(
        String texto) {
}
