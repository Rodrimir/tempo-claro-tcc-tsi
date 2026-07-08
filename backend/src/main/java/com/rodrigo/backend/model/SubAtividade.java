package com.rodrigo.backend.model;

import lombok.Data;
import java.util.UUID;
import lombok.Builder;
import java.time.LocalTime;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

// @audit-ok [Criar Hábito(3M) / Dashboard(3M) — entidade SubAtividade: parte da meta diária com janela de horário]

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubAtividade {

    private UUID id;
    private UUID habitoId;
    private Integer ordem;
    private Integer alvoParcial;
    private LocalTime horarioInicio;
    private LocalTime horarioFim;
}