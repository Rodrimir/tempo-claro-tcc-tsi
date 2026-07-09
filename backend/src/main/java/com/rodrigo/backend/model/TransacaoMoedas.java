package com.rodrigo.backend.model;

import lombok.Data;
import java.util.UUID;
import lombok.Builder;
import jakarta.persistence.Id;
import java.time.OffsetDateTime;
import jakarta.persistence.Table;
import jakarta.persistence.Entity;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

// @audit-ok [Execução(3M) / Loja(3M) — ledger imutável de economia: cada linha é um crédito ou débito de moedas]

@Entity
@Table(name = "transacoes_moedas")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransacaoMoedas {

    @Id
    private UUID id;
    private UUID habitoId;
    private UUID execucaoId;
    private String tipo;
    private Integer valor;

    @Builder.Default
    private OffsetDateTime dataHora = OffsetDateTime.now();
}
