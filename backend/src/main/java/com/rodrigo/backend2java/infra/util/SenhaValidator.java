package com.rodrigo.backend2java.infra.util;

import java.util.regex.Pattern;

public final class SenhaValidator {

    public static final int TAMANHO_MINIMO = 8;

    private static final Pattern TEM_MAIUSCULA = Pattern.compile("[A-Z]");
    private static final Pattern TEM_ESPECIAL = Pattern.compile("[^A-Za-z0-9]");

    private SenhaValidator() {
    }

    public static String motivoInvalida(final String senha) {
        if (senha == null || senha.length() < TAMANHO_MINIMO) {
            return "A senha deve ter pelo menos " + TAMANHO_MINIMO + " caracteres.";
        }
        if (!TEM_MAIUSCULA.matcher(senha).find()) {
            return "A senha deve ter pelo menos uma letra maiúscula.";
        }
        if (!TEM_ESPECIAL.matcher(senha).find()) {
            return "A senha deve ter pelo menos um caractere especial.";
        }
        return null;
    }
}
