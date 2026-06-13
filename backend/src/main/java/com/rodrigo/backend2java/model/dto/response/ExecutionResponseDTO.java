package com.rodrigo.backend2java.model.dto.response;

import lombok.Builder;

@Builder
public record ExecutionResponseDTO(
    Integer moedas_ganhas,
    Integer moedas_totais,
    Integer dias_seguidos,
    Integer novo_nivel,
    String texto_feedback
) {}
