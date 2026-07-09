package com.rodrigo.backend.model;

import lombok.Data;
import java.util.UUID;
import lombok.Builder;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Entity;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

// @audit-ok [Priming(3M) — entidade de frases motivacionais; categoriaId NULL indica texto genérico (fallback)]

@Entity
@Table(name = "biblioteca_textos")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BibliotecaTexto {

    @Id
    private UUID id;
    private UUID categoriaId;

    @Builder.Default
    private String idioma = "pt-BR";

    private String textoPreTarefa;
    private String textoSucessoPadrao;
    private String textoSucessoExtra;
    private String textoAvisoUrgencia;
}