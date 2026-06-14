// @audit-ok: BACKEND-AuthResponseDTO.java-01
package com.rodrigo.backend2java.model.dto.response;

import lombok.Builder;

@Builder
public record AuthResponseDTO(
    String token,
    UserDTO user
) {
    @Builder
    public record UserDTO(
        String name,
        String email
    ) {}
}
