package com.rodrigo.backend2java.model.dto.response;
import java.time.LocalDate;
import lombok.Builder;

// @audit-ok [E2.2 (item 3) — um dos 7 dias sempre presentes na resposta de
// GET /api/stats/weekly, mesmo sem execução nenhuma (valor_realizado=0,
// execucoes=0, meta_cumprida=false nesse caso) — é isso que evita buracos
// no gráfico de barras.]
@Builder
public record DiaStatsDTO(
        LocalDate data,
        String nome,
        Integer valor_realizado,
        Integer execucoes,
        Boolean meta_cumprida,
        // @audit-ok [E2.5 (item 2) — RF10: true quando valor_realizado vem de uma
        // desistência/proteção de escudo (nenhuma execução completa nesse dia).
        // O frontend usa isto pra colorir a barra diferente — nunca junto com
        // meta_cumprida=true, StatsService garante que os dois nunca coexistem.]
        Boolean parcial) {
}
