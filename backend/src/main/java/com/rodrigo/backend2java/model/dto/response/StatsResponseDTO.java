package com.rodrigo.backend2java.model.dto.response;
import java.util.List;
import lombok.Builder;

// @audit-ok [E2.2 — resposta de GET /api/stats/weekly?habitoId={uuid}.
// constancia_semanal_percentual é o indicador do RF17 (item 4/6 da tarefa):
// dias_com_meta_cumprida / 7, já em percentual (0-100) — antes desta tarefa
// não existia em lugar nenhum, nem no backend nem na tela.]
@Builder
public record StatsResponseDTO(
        List<DiaStatsDTO> dias,
        Integer recorde,
        Integer dias_com_meta_cumprida,
        Integer constancia_semanal_percentual) {
}
