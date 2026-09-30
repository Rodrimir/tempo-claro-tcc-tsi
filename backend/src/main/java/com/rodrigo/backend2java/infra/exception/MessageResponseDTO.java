package com.rodrigo.backend2java.infra.exception;
import lombok.Builder;
@Builder
public record MessageResponseDTO(
        boolean success,
        String message) {
}
