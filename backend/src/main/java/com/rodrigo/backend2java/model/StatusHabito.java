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
public class StatusHabito {

    private UUID habitoId;
    
    @Builder.Default
    private Integer moedasLocais = 0;
    
    @Builder.Default
    private Integer bloqueiosAcumulados = 0;
    
    @Builder.Default
    private Integer diasSeguidos = 0;
    
    @Builder.Default
    private Integer execucoesHoje = 0;
    
    private OffsetDateTime proximoVencimento;
    
    @Builder.Default
    private Boolean bloqueioUsadoHoje = false;
}
