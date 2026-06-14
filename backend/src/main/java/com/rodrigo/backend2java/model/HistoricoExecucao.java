// @audit-ok: BACKEND-HistoricoExecucao.java-01
package com.rodrigo.backend2java.model;

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
