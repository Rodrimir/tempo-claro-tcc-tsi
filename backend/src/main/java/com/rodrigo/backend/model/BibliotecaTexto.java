package com.rodrigo.backend.model;

import lombok.Data;
import java.util.UUID;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

// @audit-ok [Priming(3M) — entidade de frases motivacionais; categoriaId NULL indica texto genérico (fallback)]

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BibliotecaTexto {

    private UUID id;
    private UUID categoriaId;

    @Builder.Default
    private String idioma = "pt-BR";

    private String textoPreTarefa;
    private String textoSucessoPadrao;
    private String textoSucessoExtra;
    private String textoAvisoUrgencia;
}