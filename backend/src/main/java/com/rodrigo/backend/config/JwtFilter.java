package com.rodrigo.backend.config;

import com.rodrigo.backend.repository.UsuarioRepository;
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

// @audit-ok [Verificação de Token (7) — filtro JWT: doFilterInternal roda uma vez por requisição, antes do controller, para validar o Bearer token]

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

        // @audit-info [Verificação de Token (7) — extrai o token de "Authorization: Bearer <token>": ponto onde o cliente reapresenta o JWT emitido no login/cadastro]
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;

        // @audit-info [Verificação de Token (7) — sem header Bearer: segue sem autenticar (rota pública passa; rota protegida é barrada adiante pelo Spring Security)]
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        jwt = authHeader.substring(7);

        // @audit-info [Verificação de Token (8) — delega ao JwtService a extração do email; tokens malformados são descartados silenciosamente (JwtException)]
        try {
            userEmail = jwtService.extractEmail(jwt);
        } catch (JwtException e) {
            filterChain.doFilter(request, response);
            return;
        }

        // @audit-ok [Verificação de Token (9) — confirma que o usuário existe (existsByEmail) e que o token é válido (isTokenValid: email confere + não expirou)]
        if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {

            if (usuarioRepository.existsByEmail(userEmail) && jwtService.isTokenValid(jwt, userEmail)) {

                // @audit-ok [Verificação de Token (10) — registra a autenticação no SecurityContextHolder; os controllers leem o email autenticado a partir daqui]
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
