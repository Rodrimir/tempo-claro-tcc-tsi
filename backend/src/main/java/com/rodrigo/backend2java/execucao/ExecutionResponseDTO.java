package com.rodrigo.backend2java.execucao;
import lombok.Builder;

/**
 * Resposta de uma execução registrada.
 *
 * <p>Nenhuma moeda é creditada aqui: o crédito é do dia inteiro e acontece no
 * fechamento (RF11/RF12 + §8.1 da monografia). Por isso o campo
 * {@code moedas_ganhas} deu lugar a {@code moedas_previstas_hoje} — a tela de
 * sucesso mostra quanto o dia rende <i>se fechar assim</i>, rotulado como "a
 * receber", e {@code moedas_totais} continua sendo o saldo já confirmado.
 */
@Builder
public record ExecutionResponseDTO(
        /** Quanto o dia renderá se fechar como está agora. Ainda não creditado. */
        Integer moedas_previstas_hoje,
        /** Saldo confirmado do hábito — só muda no fechamento e na compra de escudo. */
        Integer moedas_totais,
        /** Total realizado hoje, base da avaliação da meta (RF07). */
        Integer valor_acumulado_hoje,
        /** Meta do dia, para a tela calcular o percentual sem consultar o dashboard. */
        Integer meta_base,
        Integer dias_seguidos,
        /** Nível do avatar (RF14: sobe a cada 10 dias seguidos), não a ofensiva crua. */
        Integer novo_nivel,
        String texto_feedback,
        // @audit-ok [E1.6 (item 5) — true quando o servidor classificou a
        // conclusão como extra (bônus). A tela de Sucesso usa isto para decidir
        // a celebração diferenciada, em vez de receber "bonus" já calculado
        // pelo cliente ou adivinhar com um literal 100/150 local.]
        Boolean bonus) {
}
