package com.rodrigo.backend2java.model;
import lombok.Data;
import lombok.Builder;
import java.util.UUID;
import java.time.OffsetDateTime;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

// @audit-ok [Schema v2.1, tabela calibracoes — "Medir Dificuldade" (RF20).
// D4: trabalho futuro, fora do MVP. Este model/repository existe só para não
// perder o desenho da tabela (ver docs/schema.sql v2.1), sem nenhum service
// usando ainda.]
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Calibracao {

    private UUID id;
    private UUID habitoId;
    private Integer metaSugerida;

    @Builder.Default
    private Integer incrementoSugerido = 0;

    @Builder.Default
    private Boolean aceita = false;

    @Builder.Default
    private OffsetDateTime criadoEm = OffsetDateTime.now();
}
