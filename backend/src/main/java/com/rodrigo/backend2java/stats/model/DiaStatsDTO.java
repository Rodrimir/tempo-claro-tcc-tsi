package com.rodrigo.backend2java.stats.model;
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
        Boolean dia_programado,
        // Dia anterior à criação do hábito: não conta na constância.
        Boolean antes_da_criacao,
        // Dia da criação em que as ocorrências já tinham passado: concluído sem execução.
        Boolean dispensado) {
}
