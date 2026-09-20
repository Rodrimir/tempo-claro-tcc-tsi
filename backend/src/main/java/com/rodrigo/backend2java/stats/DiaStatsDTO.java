package com.rodrigo.backend2java.stats;
import java.time.LocalDate;
import lombok.Builder;

@Builder
public record DiaStatsDTO(
        LocalDate data,
        String nome,
        Integer valor_realizado,
        Integer execucoes,
        Boolean meta_cumprida,
        Boolean parcial,
        Boolean dia_programado) {
}
