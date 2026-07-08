package com.rodrigo.backend.model;

import lombok.Data;
import java.util.UUID;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

// @audit-ok [Criar Hábito(3M) — entidade do catálogo fixo de moldes: AGUA, ESTUDO, EXERCICIO]

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoriaHabito {

    private UUID id;
    private String codigo;
    private String nome;
    private String unidadeMedida;
    private String corHex;
    private String iconeUrl;
}