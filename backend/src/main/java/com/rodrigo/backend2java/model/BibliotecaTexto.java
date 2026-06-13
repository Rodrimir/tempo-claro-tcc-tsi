package com.rodrigo.backend2java.model;

import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BibliotecaTexto {

    private UUID id;
    private String categoria;
    
    @Builder.Default
    private String idioma = "pt-BR";
    
    private String textoPreTarefa;
    private String textoSucessoPadrao;
    private String textoSucessoExtra;
    private String textoAvisoUrgencia;
}
