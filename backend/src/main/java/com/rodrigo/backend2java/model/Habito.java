package com.rodrigo.backend2java.model;
import lombok.Data;
import java.util.UUID;
import lombok.Builder;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

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
