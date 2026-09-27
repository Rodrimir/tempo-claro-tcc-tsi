package com.rodrigo.backend2java.usuario.model;
import java.util.UUID;
import lombok.Builder;

@Builder
public record UsuarioResponseDTO(
        UUID id,
        String nome,
        String email,
        String fuso_horario,
        String preferencia_idioma,
        String tema) {
}
