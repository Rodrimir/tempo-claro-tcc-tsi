package com.rodrigo.backend2java.infra.security;
import com.rodrigo.backend2java.infra.jwt.CustomJwtAuthenticationConverter;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final CustomJwtAuthenticationConverter customJwtAuthenticationConverter;

    /**
     * Origens que podem chamar a API. Era {@code "*"} — qualquer site do mundo podia
     * disparar requisições autenticadas do navegador de um usuário logado.
     */
    @Value("${app.cors.allowed-origins}")
    private List<String> origensPermitidas;

    public SecurityConfig(CustomJwtAuthenticationConverter customJwtAuthenticationConverter) {
        this.customJwtAuthenticationConverter = customJwtAuthenticationConverter;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        final var path = PathPatternRequestMatcher.withDefaults();

        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authorize -> {
                    authorize.requestMatchers(
                            path.matcher("/v3/api-docs/**"),
                            path.matcher("/swagger-ui.html"),
                            path.matcher("/swagger-ui/**")
                    ).permitAll();
                    authorize.requestMatchers(path.matcher(HttpMethod.POST, "/api/auth/login")).permitAll();
                    authorize.requestMatchers(path.matcher(HttpMethod.POST, "/api/auth/register")).permitAll();
                    // PLANO_REESTRUTURACAO.md, B/C — as quatro rotas do fluxo de
                    // verificação de e-mail e recuperação de senha só fazem sentido
                    // para quem ainda não tem (ou perdeu) um token válido.
                    authorize.requestMatchers(path.matcher(HttpMethod.POST, "/api/auth/verify-email")).permitAll();
                    authorize.requestMatchers(path.matcher(HttpMethod.POST, "/api/auth/resend-code")).permitAll();
                    authorize.requestMatchers(path.matcher(HttpMethod.POST, "/api/auth/forgot-password")).permitAll();
                    authorize.requestMatchers(path.matcher(HttpMethod.POST, "/api/auth/reset-password")).permitAll();
                    authorize.anyRequest().authenticated();
                })
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(customJwtAuthenticationConverter))
                        // §5.1 da monografia distingue 401 (credenciais inválidas, no
                        // login) de 403 (token ausente ou expirado). O padrão do
                        // resource server devolve 401 para os dois casos.
                        .authenticationEntryPoint(this::tokenAusenteOuExpirado));

        return http.build();
    }

    private void tokenAusenteOuExpirado(final HttpServletRequest request, final HttpServletResponse response,
            final AuthenticationException excecao) throws IOException {
        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.getWriter().write("{\"success\":false,\"message\":\"Token ausente ou expirado.\"}");
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(origensPermitidas);
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
