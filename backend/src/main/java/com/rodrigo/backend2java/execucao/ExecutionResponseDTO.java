package com.rodrigo.backend2java.execucao;
import lombok.Builder;

@Builder
public record ExecutionResponseDTO(
        Integer moedas_ganhas_agora,
        Integer moedas_totais,
        Integer valor_acumulado_hoje,
        Integer meta_base,
        Integer dias_seguidos,
        Integer novo_nivel,
        String texto_feedback,
        Boolean bonus) {
}
