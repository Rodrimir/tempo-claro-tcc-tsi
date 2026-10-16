package com.rodrigo.backend2java.stats.model;
import java.util.List;
import java.time.LocalDate;
import lombok.Builder;

@Builder
public record StatsResponseDTO(
        List<DiaStatsDTO> dias,

        List<RecordeDTO> recordes,

        Integer dias_com_meta_cumprida,

        Integer constancia_percentual,

        Integer dias_periodo,

        Integer dias_cobrados) {

    @Builder
    public record RecordeDTO(
            LocalDate data,
            Integer valor) {
    }
}
