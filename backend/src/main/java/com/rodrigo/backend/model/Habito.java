package com.rodrigo.backend.model;

import lombok.Data;
import java.util.UUID;
import lombok.Builder;
import jakarta.persistence.Id;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import jakarta.persistence.Table;
import jakarta.persistence.Entity;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

// @audit-ok [Dashboard(3M) / Criar Hábito(3M) — entidade Habito mapeada para a tabela habitos do novo schema]

@Entity
@Table(name = "habitos")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Habito {

    @Id
    private UUID id;
    private UUID usuarioId;
    private UUID categoriaId;
    private String titulo;
    private String gatilhoAncora;
    private LocalTime horarioAgendado;
    private String tipoMedida;
    private Integer metaBase;
    private Integer metaMaxima;
    private Integer diasParaAumento;
    private Integer incrementoMeta;

    @Builder.Default
    private Boolean ativo = true;

    private OffsetDateTime arquivadoEm;

    @Builder.Default
    private OffsetDateTime criadoEm = OffsetDateTime.now();
}