package com.rodrigo.backend2java.infra.i18n;

import java.util.Locale;
import org.springframework.context.NoSuchMessageException;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.context.support.ResourceBundleMessageSource;

// Textos que a API devolve ao usuário, em pt-BR (padrão) e en-US. Os arquivos ficam em
// resources/i18n/mensagens*.properties. É estático para que as exceções resolvam o texto em
// português no construtor, mesmo fora do contexto do Spring (testes de unidade).
public final class Mensagens {

    public static final Locale PT = Locale.forLanguageTag("pt-BR");
    public static final Locale EN = Locale.forLanguageTag("en-US");

    private static final ResourceBundleMessageSource FONTE = new ResourceBundleMessageSource();

    static {
        FONTE.setBasename("i18n/mensagens");
        FONTE.setDefaultEncoding("UTF-8");
        FONTE.setFallbackToSystemLocale(false);
        FONTE.setDefaultLocale(PT);
    }

    private Mensagens() {
    }

    public static String em(final Locale idioma, final String chave, final Object... args) {
        return FONTE.getMessage(chave, args, chave, idioma == null ? PT : idioma);
    }

    public static String daRequisicao(final String chave, final Object... args) {
        return em(LocaleContextHolder.getLocale(), chave, args);
    }

    // Devolve null quando a chave não existe, para quem precisa cair em outro texto.
    public static String seExistir(final Locale idioma, final String chave, final Object... args) {
        try {
            return FONTE.getMessage(chave, args, idioma == null ? PT : idioma);
        } catch (final NoSuchMessageException e) {
            return null;
        }
    }

    public static Locale doIdioma(final String preferencia) {
        return preferencia != null && preferencia.toLowerCase(Locale.ROOT).startsWith("en") ? EN : PT;
    }
}
