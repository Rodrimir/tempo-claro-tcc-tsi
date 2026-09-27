package com.rodrigo.backend2java.infra.util;

import java.time.ZoneId;
import java.time.DateTimeException;
import com.rodrigo.backend2java.usuario.model.Usuario;

public final class ZonaUsuario {

    private static final String FUSO_PADRAO = "America/Sao_Paulo";

    private ZonaUsuario() {
    }

    public static ZoneId resolver(final Usuario usuario) {
        return resolver(usuario != null ? usuario.getFusoHorario() : null);
    }

    public static ZoneId resolver(final String fusoHorario) {
        if (fusoHorario == null || fusoHorario.isBlank()) {
            return ZoneId.of(FUSO_PADRAO);
        }
        try {
            return ZoneId.of(fusoHorario);
        } catch (final DateTimeException e) {
            return ZoneId.of(FUSO_PADRAO);
        }
    }

    public static boolean isValido(final String fusoHorario) {
        if (fusoHorario == null || fusoHorario.isBlank()) {
            return false;
        }
        try {
            ZoneId.of(fusoHorario);
            return true;
        } catch (final DateTimeException e) {
            return false;
        }
    }
}
