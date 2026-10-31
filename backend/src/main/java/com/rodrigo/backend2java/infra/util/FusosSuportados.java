package com.rodrigo.backend2java.infra.util;

import java.util.List;
import java.util.Set;

// Fusos que o Perfil e o guia de primeiro acesso aceitam: Brasil e América do Norte. Contas
// antigas com outro fuso continuam funcionando; só a troca é limitada a esta lista. A mesma lista
// fica em frontend/src/model/Fusos.js.
public final class FusosSuportados {

    public static final List<String> BRASIL = List.of(
            "America/Noronha", "America/Belem", "America/Fortaleza", "America/Recife",
            "America/Araguaina", "America/Maceio", "America/Bahia", "America/Sao_Paulo",
            "America/Santarem", "America/Campo_Grande", "America/Cuiaba", "America/Porto_Velho",
            "America/Boa_Vista", "America/Manaus", "America/Eirunepe", "America/Rio_Branco");

    public static final List<String> AMERICA_DO_NORTE = List.of(
            "America/St_Johns", "America/Halifax", "America/Toronto", "America/New_York",
            "America/Chicago", "America/Winnipeg", "America/Regina", "America/Denver",
            "America/Edmonton", "America/Phoenix", "America/Los_Angeles", "America/Vancouver",
            "America/Anchorage", "Pacific/Honolulu", "America/Mexico_City", "America/Cancun",
            "America/Tijuana");

    private static final Set<String> TODOS = Set.copyOf(
            java.util.stream.Stream.concat(BRASIL.stream(), AMERICA_DO_NORTE.stream()).toList());

    private FusosSuportados() {
    }

    public static boolean contem(final String fuso) {
        return fuso != null && TODOS.contains(fuso);
    }
}
