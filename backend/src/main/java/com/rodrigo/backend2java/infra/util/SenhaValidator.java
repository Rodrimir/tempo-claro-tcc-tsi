package com.rodrigo.backend2java.infra.util;

import java.util.regex.Pattern;

// @audit-ok [Ponto único de validação de força de senha — usado por
// AuthService (cadastro) e UsuarioService (troca de senha no perfil e, mais
// tarde, recuperação de senha). Antes desta classe existir, AuthService.
// cadastrar não validava senha nenhuma (dava pra criar conta com senha de 1
// caractere pela API) e UsuarioService só checava o tamanho mínimo — a
// exigência de maiúscula e caractere especial é nova nos dois lugares, não
// só uma correção de duplicação.]
public final class SenhaValidator {

    public static final int TAMANHO_MINIMO = 8;

    private static final Pattern TEM_MAIUSCULA = Pattern.compile("[A-Z]");
    private static final Pattern TEM_ESPECIAL = Pattern.compile("[^A-Za-z0-9]");

    private SenhaValidator() {
    }

    /**
     * Nunca lança exceção — devolve o motivo da recusa (para a mensagem de erro)
     * ou {@code null} quando a senha atende as três regras. O chamador decide
     * como comunicar isso (ValidacaoException, 422, etc.), este utilitário só
     * decide o QUE é uma senha válida, num lugar só.
     */
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

    public static boolean isValida(final String senha) {
        return motivoInvalida(senha) == null;
    }
}
