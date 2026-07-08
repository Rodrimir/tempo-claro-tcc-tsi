package com.rodrigo.backend.model;

import lombok.Data;
import java.util.UUID;
import lombok.Builder;
import java.time.OffsetDateTime;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

// @audit-ok [Execução(3M) / Loja(3M) — ledger imutável de economia: cada linha é um crédito ou débito de moedas]

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransacaoMoedas {

    private UUID id;
    private UUID habitoId;
    private UUID execucaoId;
    private String tipo;
    private Integer valor;

    @Builder.Default
    private OffsetDateTime dataHora = OffsetDateTime.now();
}
