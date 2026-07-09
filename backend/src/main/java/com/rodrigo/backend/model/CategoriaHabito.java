package com.rodrigo.backend.model;

import lombok.Data;
import java.util.UUID;
import lombok.Builder;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Entity;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

// @audit-ok [Criar Hábito(3M) — entidade do catálogo fixo de moldes: AGUA, ESTUDO, EXERCICIO]

@Entity
@Table(name = "categorias_habito")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CategoriaHabito {

    @Id
    private UUID id;
    private String codigo;
    private String nome;
    private String unidadeMedida;
    private String corHex;
    private String iconeUrl;
}