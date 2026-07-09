package com.rodrigo.backend.model;

import lombok.Data;
import java.util.UUID;
import lombok.Builder;
import jakarta.persistence.Id;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import jakarta.persistence.Table;
import jakarta.persistence.Entity;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

// @audit-ok [Execução(3M) / Dashboard(3M) — fechamento diário do hábito; streak é derivado pela sequência de 'CONCLUIDO']

@Entity
@Table(name = "registros_diarios")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegistroDiario {

    @Id
    private UUID id;
    private UUID habitoId;
    private LocalDate dataExecucao;
    private Integer valorTotalDia;
    private Integer metaDoDia;
    private String status;
    private OffsetDateTime horaConclusao;

    @Builder.Default
    private Boolean protegidoPorEscudo = false;

    private String sentimentoPosConclusao;
}
