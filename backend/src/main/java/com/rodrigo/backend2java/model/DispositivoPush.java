package com.rodrigo.backend2java.model;
import lombok.Data;
import lombok.Builder;
import java.util.UUID;
import java.time.OffsetDateTime;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

// @audit-ok [Schema v2.1, tabela dispositivos_push — D3: RF18/RF19/RNF16 são
// trabalho futuro. Model/repository existem só para não perder o desenho da
// tabela; nenhum agendador ou consumidor de push foi implementado.]
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DispositivoPush {

    private UUID id;
    private UUID usuarioId;
    private String tokenDispositivo;

    @Builder.Default
    private String plataforma = "ANDROID";

    @Builder.Default
    private Boolean ativo = true;

    @Builder.Default
    private OffsetDateTime criadoEm = OffsetDateTime.now();

    private OffsetDateTime ultimoUso;
}
