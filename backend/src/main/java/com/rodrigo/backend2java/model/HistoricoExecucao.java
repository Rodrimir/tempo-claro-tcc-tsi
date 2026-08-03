package com.rodrigo.backend2java.model;
import lombok.Data;
import lombok.Builder;
import java.util.UUID;
import java.time.OffsetDateTime;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HistoricoExecucao {

    private UUID id;
    private UUID habitoId;
    private UUID executionToken;

    @Builder.Default
    private OffsetDateTime dataHoraExecucao = OffsetDateTime.now();

    private Integer valorRealizado;

    @Builder.Default
    private Integer moedasGanhas = 0;

    private String tipoSucesso;
}
