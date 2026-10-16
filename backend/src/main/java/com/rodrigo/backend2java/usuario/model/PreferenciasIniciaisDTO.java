package com.rodrigo.backend2java.usuario.model;
import jakarta.validation.constraints.NotBlank;

// Passos 1 e 2 do guia de primeiro acesso: idioma e fuso.
public record PreferenciasIniciaisDTO(
        @NotBlank(message = "{validacao.idioma.obrigatorio}") String preferencia_idioma,
        @NotBlank(message = "{validacao.fuso.obrigatorio}") String fuso_horario) {
}
