package com.rodrigo.backend2java.model;

import java.time.OffsetDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Usuario {

    private UUID id;
    private String nome;
    private String email;
    private String senhaHash;

    @Builder.Default
    private String fusoHorario = "America/Sao_Paulo";

    @Builder.Default
    private String preferenciaIdioma = "pt-BR";

    @Builder.Default
    private OffsetDateTime criadoEm = OffsetDateTime.now();
}
