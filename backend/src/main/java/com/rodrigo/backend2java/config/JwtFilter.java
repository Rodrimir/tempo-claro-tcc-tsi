package com.rodrigo.backend2java.config;

import com.rodrigo.backend2java.repository.UsuarioRepository;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;

// @audit-ok [Verificação de Token (4) — filtro JWT: valida Bearer token em cada requisição antes de chegar ao controller]

@Component
@RequiredArgsConstructor
public class JwtFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        // @audit-ok [Interceptor de Requisição (7) — extrai o Bearer token do header Authorization]
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;

        // @audit-ok [Verificação de Token (5) — permite passar sem autenticação se não houver header Bearer]
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        jwt = authHeader.substring(7);

        // @audit-ok [Verificação de Token (6) — extrai email do token; descarta silenciosamente tokens malformados]
        try {
            userEmail = jwtService.extractEmail(jwt);
        } catch (JwtException e) {
            filterChain.doFilter(request, response);
            return;
        }

        // @audit-ok [Verificação de Token (7) — valida existência do usuário e assinatura/expiração do token]
        if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {

            if (usuarioRepository.existsByEmail(userEmail) && jwtService.isTokenValid(jwt, userEmail)) {

                // @audit-ok [Verificação de Token (8) — registra autenticação no SecurityContextHolder para acesso nos controllers]
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userEmail,
                        null,
                        new ArrayList<>());

                authToken.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }
        filterChain.doFilter(request, response);
    }
}
