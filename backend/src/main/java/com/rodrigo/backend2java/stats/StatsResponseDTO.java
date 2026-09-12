package com.rodrigo.backend2java.stats;
import java.util.List;
import java.time.LocalDate;
import lombok.Builder;

/**
 * Acompanhamento de desempenho de um hábito (RF17, F16–F20).
 *
 * <p>v3.0: a janela deixou de ser semanal e passou a ser mensal. Duas mudanças de
 * contrato vêm junto:
 * <ul>
 *   <li>{@code recorde} (um número só) deu lugar a {@link RecordeDTO}{@code []} —
 *       os três maiores dias do período, cada um com sua data;</li>
 *   <li>{@code constancia_semanal_percentual} virou {@code constancia_percentual},
 *       porque o denominador não é mais uma semana.</li>
 * </ul>
 */
@Builder
public record StatsResponseDTO(
        /** Um item por dia do período, do mais antigo ao mais recente, sem buracos. */
        List<DiaStatsDTO> dias,

        /**
         * Os três maiores valores realizados num único dia do período, do maior para
         * o menor (F18). Antes era só o maior, e só entre dias com meta cumprida —
         * a monografia define recorde como "o maior valor realizado em um único
         * dia", sem essa condição.
         */
        List<RecordeDTO> recordes,

        Integer dias_com_meta_cumprida,

        /** Percentual de dias do período em que a meta foi cumprida (F19). */
        Integer constancia_percentual,

        /** Tamanho da janela em dias, para a tela não precisar assumir o número. */
        Integer dias_periodo,

        /**
         * Quantos dias da janela o hábito de fato cobrava (a máscara semanal).
         * É o denominador de {@code constancia_percentual} — num hábito de segunda
         * a sexta, 30 dias de janela contêm cerca de 21 dias cobrados.
         */
        Integer dias_cobrados) {

    @Builder
    public record RecordeDTO(
            LocalDate data,
            Integer valor) {
    }
}
