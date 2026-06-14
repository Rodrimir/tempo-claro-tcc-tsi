// @audit-ok: BACKEND-MessageResponseDTO.java-01
package com.rodrigo.backend2java.model.dto.response;

import lombok.Builder;

@Builder
public record MessageResponseDTO(
    boolean success,
    String message
) {}
