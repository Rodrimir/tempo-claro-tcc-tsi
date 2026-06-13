package com.rodrigo.backend2java.model;

import java.time.LocalTime;
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
public class Habito {

    private UUID id;
    private UUID usuarioId;
    private String titulo;
    private String categoria;
    private String gatilhoAncora;
    private String tipoMedida;
    private String modalidade;
    private LocalTime horarioAgendado;
    private Integer metaBase;
    
    @Builder.Default
    private Integer metaFrequenciaDiaria = 1;
    
    private Integer intervaloMinutos;
    
    @Builder.Default
    private Boolean ativo = true;
    
    @Builder.Default
    private OffsetDateTime criadoEm = OffsetDateTime.now();
}