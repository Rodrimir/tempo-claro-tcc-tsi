package com.rodrigo.backend2java.usuario.model;
import lombok.Builder;
@Builder
public record ProfileUpdateDTO(
        String nome,
        String fuso_horario,
        String tema,
        String preferencia_idioma,
        String senha_atual,
        String nova_senha) {
}
