package com.rodrigo.backend2java.autenticacao.model;
import lombok.Builder;
@Builder
public record AuthResponseDTO(
        String token,
        UserDTO user)
{
    @Builder
    public record UserDTO(
            String name,
            String email,
            String fuso_horario,
            String tema,
            String preferencia_idioma) {
    }
}
