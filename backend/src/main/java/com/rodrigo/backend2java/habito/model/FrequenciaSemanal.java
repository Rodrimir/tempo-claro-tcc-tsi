package com.rodrigo.backend2java.habito.model;

import java.time.LocalDate;

public final class FrequenciaSemanal {

    public static final String TODO_DIA = "1111111";

    private FrequenciaSemanal() {
    }

    public static boolean ehDiaProgramado(final String mascara, final LocalDate dia) {
        if (mascara == null || mascara.length() != 7) {
            return true;
        }
        return mascara.charAt(indiceDe(dia)) == '1';
    }

    public static int indiceDe(final LocalDate dia) {
        return dia.getDayOfWeek().getValue() % 7;
    }
}
