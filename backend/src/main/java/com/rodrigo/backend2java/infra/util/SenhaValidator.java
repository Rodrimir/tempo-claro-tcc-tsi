package com.rodrigo.backend2java.infra.util;

import java.util.regex.Pattern;

public final class SenhaValidator {

    public static final int TAMANHO_MINIMO = 8;
    // @note - 8.1 (Cadastro) TAMANHO_MAXIMO: não espelha nenhuma coluna do banco (usu_senha_hash
    // guarda só o HASH de tamanho fixo, não a senha crua — ver Usuario.java item 9.2). Valor
    // escolhido pelo autor, bem abaixo do corte de 72 bytes do BCrypt (ver audit-info abaixo).
    public static final int TAMANHO_MAXIMO = 25;

    private static final Pattern TEM_MAIUSCULA = Pattern.compile("[A-Z]");
    private static final Pattern TEM_ESPECIAL = Pattern.compile("[^A-Za-z0-9]");

    private SenhaValidator() {
    }

    // @note - 8.1 (Cadastro) motivoInvalida: mesmas regras da validação client-side
    // (Login/validation.js, item 2.1: tamanho mínimo e máximo, maiúscula, caractere especial),
    // reaplicadas no servidor. Também é chamado por redefinirSenha (recuperação de senha, fora
    // deste mapeamento), então o teto de tamanho vale para os dois fluxos. Ver README §8 >
    // Cadastro > item 8.
    // @audit-info - 8.1 (Cadastro) [outcome: fixed] não havia limite máximo de tamanho aqui nem
    // no RegisterRequestDTO (item 5.1). O hash gerado com BCryptPasswordEncoder
    // (SecurityConfig.java, item 6.2) ignora silenciosamente qualquer byte de senha além do 72º:
    // uma senha muito longa passava por toda a validação, mas tinha sua cauda descartada na hora
    // de autenticar depois. Corrigido com TAMANHO_MAXIMO = 25, abaixo do corte do BCrypt.
    public static String motivoInvalida(final String senha) {
        if (senha == null || senha.length() < TAMANHO_MINIMO) {
            return "A senha deve ter pelo menos " + TAMANHO_MINIMO + " caracteres.";
        }
        if (senha.length() > TAMANHO_MAXIMO) {
            return "A senha deve ter no máximo " + TAMANHO_MAXIMO + " caracteres.";
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
