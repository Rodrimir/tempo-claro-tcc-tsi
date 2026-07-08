package com.rodrigo.backend.model;

import lombok.Data;
import java.util.UUID;
import lombok.Builder;
import java.time.OffsetDateTime;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

// @audit-ok [Execução(3M) — fato imutável de cada execução; sub_atividade_id opcional identifica qual parte foi executada]

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HistoricoExecucao {

    private UUID id;
    private UUID habitoId;
    private UUID subAtividadeId;
    private UUID executionToken;

    @Builder.Default
    private OffsetDateTime dataHoraExecucao = OffsetDateTime.now();

    private Integer valorRealizado;

    @Builder.Default
    private Integer moedasGanhas = 0;

    private String tipoSucesso;
}
