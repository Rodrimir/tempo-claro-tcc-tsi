package com.rodrigo.backend2java.util;

import java.time.ZoneId;
import java.time.DateTimeException;
import com.rodrigo.backend2java.model.Usuario;

// @audit-ok [E0.5.4 — ponto único de resolução/validação de fuso horário.
// NENHUM outro arquivo do projeto pode chamar ZoneId.of diretamente: todo
// fuso vindo do banco ou de uma requisição passa por aqui. Isso existe porque
// o seletor do Perfil guardava rótulos como "Brasília (BRT)" — BRT não é
// identificador IANA e ZoneId.of("BRT") lança DateTimeException. Como o fuso
// governa a virada do dia no fechamento diário (FechamentoDiarioJob), um
// valor inválido salvo silenciosamente derrubava o job para aquele usuário.]
public final class ZonaUsuario {

    // Mesmo default de Usuario.fusoHorario — repetido aqui de propósito para
    // este utilitário não depender de outra classe para saber o fallback.
    private static final String FUSO_PADRAO = "America/Sao_Paulo";

    private ZonaUsuario() {
    }

    // @audit-ok [Resolve o fuso do dono do hábito para uso em cálculo de data/hora
    // (ex.: FechamentoDiarioJob). Nunca lança exceção — usuário nulo, fuso nulo/em
    // branco ou identificador inválido caem todos no fuso padrão.]
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

    // @audit-ok [Valida um identificador ANTES de persistir (PUT /api/profile).
    // Diferente de resolver(), aqui um fuso inválido não cai em fallback — o
    // chamador decide o que fazer (UsuarioService rejeita com 400).]
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
