package com.rodrigo.backend2java.infra.util;

import java.util.Locale;

// O e-mail é guardado e comparado sem espaços nas pontas e em minúsculas. Teclados de celular
// costumam pôr a primeira letra maiúscula e um espaço depois de uma sugestão de autocompletar.
public final class EmailNormalizado {

    private EmailNormalizado() {
    }

    public static String de(final String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }
}
