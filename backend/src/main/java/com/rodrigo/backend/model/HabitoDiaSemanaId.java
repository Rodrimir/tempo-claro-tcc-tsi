package com.rodrigo.backend.model;

import lombok.Data;
import java.util.UUID;
import java.io.Serializable;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HabitoDiaSemanaId implements Serializable {

    private UUID habitoId;
    private Integer diaSemana;
}
