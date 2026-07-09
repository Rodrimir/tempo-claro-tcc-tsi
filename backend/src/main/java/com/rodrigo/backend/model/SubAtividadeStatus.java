package com.rodrigo.backend.model;

import lombok.Data;
import java.util.UUID;
import lombok.Builder;
import jakarta.persistence.Id;
import java.time.LocalDate;
import jakarta.persistence.Table;
import jakarta.persistence.Entity;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

// @audit-ok [Execução(3M) — estado de cada sub-atividade no dia; regra 3.8: moedas creditadas apenas se executada=TRUE]

@Entity
@Table(name = "sub_atividade_status")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubAtividadeStatus {

    @Id
    private UUID id;
    private UUID subAtividadeId;
    private LocalDate dataExecucao;
    private Integer valorRealizado;

    @Builder.Default
    private Boolean executada = false;

    @Builder.Default
    private Boolean moedasCreditadas = false;
}
