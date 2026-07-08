package com.rodrigo.backend.model;

import lombok.Data;
import java.util.UUID;
import lombok.Builder;
import java.time.OffsetDateTime;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

// @audit-ok [Execução(3M) — sessão ativa do timer; persiste valor_parcial para retomada após minimizar o app (F09, regra 3.7)]

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessaoExecucao {

    private UUID id;
    private UUID habitoId;
    private UUID subAtividadeId;
    private OffsetDateTime iniciadaEm;
    private OffsetDateTime pausadaEm;

    @Builder.Default
    private Integer valorParcial = 0;

    @Builder.Default
    private String estado = "EM_EXECUCAO";

    private OffsetDateTime expiraEm;
}
