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

    @Value("${app.cors.allowed-origins}")
    private List<String> origensPermitidas;

    public SecurityConfig(CustomJwtAuthenticationConverter customJwtAuthenticationConverter) {
        this.customJwtAuthenticationConverter = customJwtAuthenticationConverter;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authenticationConfiguration) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    // @note - 6.2 (Cadastro) passwordEncoder: bean BCryptPasswordEncoder, usado em
    // AuthService.cadastrar (item 7.1c) para gerar o hash gravado no banco, e em
    // CodigoVerificacaoService.gerarCodigo (item 10.1) para o hash do código de verificação.
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
                    // @note - 6.1 (Cadastro) POST /api/auth/register está em permitAll(): a rota
                    // não exige token. Ver README §8 > Cadastro > item 6.
                    authorize.requestMatchers(path.matcher(HttpMethod.POST, "/api/auth/register")).permitAll();
                    authorize.requestMatchers(path.matcher(HttpMethod.POST, "/api/auth/verify-email")).permitAll();
                    authorize.requestMatchers(path.matcher(HttpMethod.POST, "/api/auth/resend-code")).permitAll();
                    authorize.requestMatchers(path.matcher(HttpMethod.POST, "/api/auth/forgot-password")).permitAll();
                    authorize.requestMatchers(path.matcher(HttpMethod.POST, "/api/auth/reset-password")).permitAll();
                    authorize.anyRequest().authenticated();
                })
                .oauth2ResourceServer(oauth2 -> oauth2
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(customJwtAuthenticationConverter))
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
