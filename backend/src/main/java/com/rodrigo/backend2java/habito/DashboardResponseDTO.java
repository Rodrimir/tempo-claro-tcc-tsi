package com.rodrigo.backend2java.habito;
import java.util.List;
import lombok.Builder;

@Builder
public record DashboardResponseDTO(
        List<HabitoResponseDTO> habits,
        Integer limite_habitos_ativos,
        Integer custo_escudo) {
}
