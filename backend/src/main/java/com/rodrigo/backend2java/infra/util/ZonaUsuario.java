package com.rodrigo.backend2java.infra.util;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.DateTimeException;
import com.rodrigo.backend2java.usuario.model.Usuario;

public final class ZonaUsuario {

    private static final String FUSO_PADRAO = "America/Sao_Paulo";

    private ZonaUsuario() {
    }

    // Fuso em vigor agora. Uma troca feita pelo Perfil fica pendente até a meia-noite seguinte no
    // fuso de antes; depois desse instante o pendente já vale, mesmo antes de ser gravado como
    // usu_fuso_horario (promoverPendente).
    public static ZoneId resolver(final Usuario usuario) {
        return resolver(usuario, Instant.now());
    }

    public static ZoneId resolver(final Usuario usuario, final Instant agora) {
        if (usuario == null) {
            return resolver((String) null);
        }
        if (pendenteJaVale(usuario, agora)) {
            return resolver(usuario.getFusoPendente());
        }
        return resolver(usuario.getFusoHorario());
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

    // Grava o pendente como fuso do usuário quando ele já vale. Devolve true se mudou a entidade.
    public static boolean promoverPendente(final Usuario usuario, final Instant agora) {
        if (usuario == null || !pendenteJaVale(usuario, agora)) {
            return false;
        }
        usuario.setFusoHorario(usuario.getFusoPendente());
        usuario.setFusoPendente(null);
        usuario.setFusoVigenteEm(null);
        return true;
    }

    // Início do dia seguinte no fuso dado. atStartOfDay resolve dias que começam fora da meia-noite
    // por causa do horário de verão.
    public static OffsetDateTime proximaMeiaNoite(final ZoneId zona, final Instant agora) {
        return agora.atZone(zona).toLocalDate().plusDays(1).atStartOfDay(zona).toOffsetDateTime();
    }

    private static boolean pendenteJaVale(final Usuario usuario, final Instant agora) {
        return usuario.getFusoPendente() != null && usuario.getFusoVigenteEm() != null
                && !agora.isBefore(usuario.getFusoVigenteEm().toInstant());
    }
}
