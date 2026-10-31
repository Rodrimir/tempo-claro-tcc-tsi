package com.rodrigo.backend2java.regras;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;

import org.junit.jupiter.api.Test;

import com.rodrigo.backend2java.infra.util.FusosSuportados;
import com.rodrigo.backend2java.infra.util.ZonaUsuario;
import com.rodrigo.backend2java.usuario.model.Usuario;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ZonaUsuarioTest {

    private static final ZoneId NY = ZoneId.of("America/New_York");
    private static final ZoneId SP = ZoneId.of("America/Sao_Paulo");

    private static Instant em(final String localDateTime, final ZoneId zona) {
        return LocalDateTime.parse(localDateTime).atZone(zona).toInstant();
    }

    @Test
    void proximaMeiaNoite_noFimDoHorarioDeVeraoAmericano() {
        // 01/11/2026: o horário de verão termina às 02:00; a meia-noite ainda é EDT (-04:00).
        final var resultado = ZonaUsuario.proximaMeiaNoite(NY, em("2026-10-31T22:00", NY));

        assertEquals(OffsetDateTime.of(2026, 11, 1, 0, 0, 0, 0, ZoneOffset.ofHours(-4)), resultado);
    }

    @Test
    void proximaMeiaNoite_noInicioDoHorarioDeVeraoAmericano() {
        // 14/03/2027: o horário de verão começa às 02:00; a meia-noite ainda é EST (-05:00).
        final var resultado = ZonaUsuario.proximaMeiaNoite(NY, em("2027-03-13T23:30", NY));

        assertEquals(OffsetDateTime.of(2027, 3, 14, 0, 0, 0, 0, ZoneOffset.ofHours(-5)), resultado);
    }

    @Test
    void proximaMeiaNoite_emDiaQueNaoComecaAMeiaNoite() {
        // Em Havana o horário de verão começa à meia-noite: o dia 08/03/2026 começa às 01:00.
        final var havana = ZoneId.of("America/Havana");

        final var resultado = ZonaUsuario.proximaMeiaNoite(havana, em("2026-03-07T20:00", havana));

        assertEquals(LocalDateTime.parse("2026-03-08T01:00"), resultado.atZoneSameInstant(havana).toLocalDateTime());
    }

    @Test
    void resolver_usaOPendenteSoDepoisDoInstanteDeVigencia() {
        final var vigencia = OffsetDateTime.parse("2026-10-17T00:00-03:00");
        final var usuario = Usuario.builder().fusoHorario("America/Sao_Paulo").fusoPendente("America/New_York")
                .fusoVigenteEm(vigencia).build();

        assertEquals(SP, ZonaUsuario.resolver(usuario, vigencia.toInstant().minusSeconds(1)));
        assertEquals(NY, ZonaUsuario.resolver(usuario, vigencia.toInstant()));
    }

    @Test
    void promoverPendente_soMudaDepoisDaVigencia() {
        final var vigencia = OffsetDateTime.parse("2026-10-17T00:00-03:00");
        final var usuario = Usuario.builder().fusoHorario("America/Sao_Paulo").fusoPendente("America/New_York")
                .fusoVigenteEm(vigencia).build();

        assertFalse(ZonaUsuario.promoverPendente(usuario, vigencia.toInstant().minusSeconds(60)));
        assertEquals("America/Sao_Paulo", usuario.getFusoHorario());
        assertTrue(ZonaUsuario.promoverPendente(usuario, vigencia.toInstant().plusSeconds(60)));
        assertEquals("America/New_York", usuario.getFusoHorario());
    }

    @Test
    void fusosSuportados_brasilEAmericaDoNorte() {
        assertEquals(16, FusosSuportados.BRASIL.size());
        assertTrue(FusosSuportados.contem("America/Noronha"));
        assertTrue(FusosSuportados.contem("Pacific/Honolulu"));
        assertTrue(FusosSuportados.contem("America/St_Johns"));
        assertFalse(FusosSuportados.contem("Europe/London"));
        FusosSuportados.AMERICA_DO_NORTE.forEach(fuso -> ZoneId.of(fuso));
    }
}
