package com.rodrigo.backend.model;

import lombok.Data;
import java.util.UUID;
import lombok.Builder;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Entity;
import jakarta.persistence.IdClass;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "habito_dias_semana")
@IdClass(HabitoDiaSemanaId.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HabitoDiaSemana {

    @Id
    private UUID habitoId;

    @Id
    private Integer diaSemana;
}
