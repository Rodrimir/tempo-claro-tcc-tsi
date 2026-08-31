package com.rodrigo.backend2java.model;
import lombok.Data;
import java.util.UUID;
import lombok.Builder;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Habito {

    private UUID id;
    private UUID usuarioId;
    private String titulo;
    private String categoria;
    private String gatilhoAncora;
    private String tipoMedida;
    private String modalidade;
    private LocalTime horarioAgendado;
    private Integer metaBase;

    // @audit-ok [E2.3 — progressão automática de meta (colunas hab_meta_maxima/
    // hab_incremento/hab_dias_incremento, já existentes no schema v2.1 desde a
    // E0.5.3, mas sem ligação nenhuma com o Java até agora).]
    private Integer metaMaxima;
    private Integer incremento;
    private Integer diasIncremento;

    // @audit-ok [E2.4 — máscara de 7 posições, domingo(posição 1)..sábado
    // (posição 7). Convenção confirmada (item 1 da tarefa): bate com
    // Date.getDay() do JS (0=Dom) e com dayOfWeek.getValue() % 7, já usado em
    // StatsService (E2.2) — ambas as pontas leem o índice 0 como domingo.]
    private String frequenciaSemanal;

    @Builder.Default
    private Integer metaFrequenciaDiaria = 1;

    // @audit-ok [E2.9 (item 4) — intervaloMinutos REMOVIDO aqui: nenhuma tabela
    // do schema v2.1 tem coluna correspondente (nem habitos, nem
    // sub_atividades) — ver docs/CONTRATO_API.md. Diferente de horarioAgendado/
    // metaFrequenciaDiaria (que também não têm coluna própria, mas têm um
    // substituto real em sub_atividades), este campo nunca teve pra onde ir:
    // não dava pra "consertar" enviando, só remover a promessa.]

    @Builder.Default
    private Boolean ativo = true;

    @Builder.Default
    private OffsetDateTime criadoEm = OffsetDateTime.now();
}
