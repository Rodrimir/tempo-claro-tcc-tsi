// @audit-ok: BACKEND-PrimingResponseDTO.java-01
package com.rodrigo.backend2java.model.dto.response;

import lombok.Builder;

@Builder
public record PrimingResponseDTO(
    String texto
) {}
