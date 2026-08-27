package com.rodrigo.backend2java.model.dto.response;
import java.util.List;
import lombok.Builder;

// @audit-ok [E1.3 — envelope de GET /api/dashboard. Antes o endpoint devolvia
// a lista de hábitos crua; agora expõe limite_habitos_ativos junto, para o
// front nunca precisar repetir esse número (RF03) como literal. O front já
// esperava esse formato: Home.jsx, Store.jsx e Execution.jsx desestruturam
// "response.data.habits || response.data" — o fallback pro array cru existia
// porque nada preenchia o campo "habits" até agora.]
@Builder
public record DashboardResponseDTO(
        List<HabitoResponseDTO> habits,
        Integer limite_habitos_ativos) {
}
