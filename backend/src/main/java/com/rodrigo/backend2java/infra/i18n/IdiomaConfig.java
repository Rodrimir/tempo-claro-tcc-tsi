package com.rodrigo.backend2java.infra.i18n;

import java.util.Locale;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.servlet.LocaleResolver;
import com.rodrigo.backend2java.usuario.model.Usuario;

// Idioma das respostas: o Accept-Language que o app manda; sem ele, a preferência do usuário
// autenticado; sem nenhum dos dois, pt-BR. O Spring só chama resolveLocale quando alguém pede o
// idioma, então requisições sem erro nem mensagem não pagam por isso.
@Configuration
public class IdiomaConfig {

    @Bean
    public LocaleResolver localeResolver() {
        return new LocaleResolver() {
            @Override
            public Locale resolveLocale(final HttpServletRequest request) {
                final var cabecalho = request.getHeader("Accept-Language");
                if (cabecalho != null && !cabecalho.isBlank()) {
                    return Mensagens.doIdioma(cabecalho.trim());
                }
                final var autenticacao = SecurityContextHolder.getContext().getAuthentication();
                if (autenticacao != null && autenticacao.getPrincipal() instanceof Usuario usuario) {
                    return Mensagens.doIdioma(usuario.getPreferenciaIdioma());
                }
                return Mensagens.PT;
            }

            @Override
            public void setLocale(final HttpServletRequest request, final HttpServletResponse response,
                    final Locale locale) {
                throw new UnsupportedOperationException("O idioma vem do cabeçalho ou do perfil");
            }
        };
    }
}
