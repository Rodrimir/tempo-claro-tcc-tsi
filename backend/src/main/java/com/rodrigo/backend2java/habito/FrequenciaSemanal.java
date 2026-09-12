package com.rodrigo.backend2java.habito;

import java.time.LocalDate;

/**
 * A máscara {@code hab_frequencia_semanal}: 7 posições, domingo(0) a sábado(6).
 *
 * <p>Existe porque a mesma regra era lida em três lugares — o fechamento do dia, o
 * cálculo do próximo vencimento e as estatísticas — e três cópias de uma convenção
 * de índice é exatamente o tipo de coisa que desalinha na primeira alteração.
 *
 * <p>A convenção de domingo como posição 0 é compartilhada com o aplicativo, que
 * monta a máscara a partir de {@code Date.getDay()} do JavaScript. Em Java,
 * {@code DayOfWeek} começa na segunda-feira e vale 7 no domingo, por isso o
 * {@code % 7}.
 */
public final class FrequenciaSemanal {

    /** Todo dia — o valor que um hábito recebe quando não escolhe dias. */
    public static final String TODO_DIA = "1111111";

    private FrequenciaSemanal() {
    }

    /**
     * {@code true} quando o hábito deve acontecer nesta data. Máscara ausente ou
     * malformada significa "todo dia": é melhor cobrar um dia a mais do que
     * silenciosamente parar de cobrar por causa de um dado corrompido.
     */
    public static boolean ehDiaProgramado(final String mascara, final LocalDate dia) {
        if (mascara == null || mascara.length() != 7) {
            return true;
        }
        return mascara.charAt(indiceDe(dia)) == '1';
    }

    /** Posição da data na máscara: 0 = domingo, 6 = sábado. */
    public static int indiceDe(final LocalDate dia) {
        return dia.getDayOfWeek().getValue() % 7;
    }
}
