package com.rodrigo.backend.model;

import lombok.Data;
import java.util.UUID;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

// @audit-ok [Dashboard(3M) — entidade do catálogo de avatares; streak_minimo determina o tier visual pela ofensiva atual]

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AvatarCatalogo {

    private UUID id;
    private UUID categoriaId;
    private String nome;
    private Integer streakMinimo;
    private String estadoExpressao;
    private String assetVisualUrl;
    private Integer ordemEvolucao;
}
