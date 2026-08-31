package com.rodrigo.backend2java.model.dto.response;
import lombok.Builder;
@Builder
public record ExecutionResponseDTO(
        Integer moedas_ganhas,
        Integer moedas_totais,
        Integer dias_seguidos,
        Integer novo_nivel,
        String texto_feedback,
        // @audit-ok [E1.6 (item 5) — true quando o servidor classificou a
        // conclusão como extra (bônus). A tela de Sucesso usa isto para decidir
        // a celebração diferenciada, em vez de receber "bonus" já calculado
        // pelo cliente ou adivinhar com um literal 100/150 local.]
        Boolean bonus) {
}
