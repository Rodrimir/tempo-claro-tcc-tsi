package com.rodrigo.backend2java.infra.jwt;

import com.rodrigo.backend2java.usuario.UsuarioRepository;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

/**
 * Transforma o JWT validado na autenticação da requisição. O subject do token é o
 * e-mail do usuário, e é ele que todos os services recebem como {@code emailContexto}.
 *
 * <p>Busca o usuário no banco a cada requisição autenticada de propósito: é o que
 * faz uma conta apagada parar de valer imediatamente, em vez de continuar aceita até
 * o token expirar (24h).
 */
@Component
public class CustomJwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private final UsuarioRepository usuarioRepository;

    public CustomJwtAuthenticationConverter(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        final var usuario = usuarioRepository.findByEmail(jwt.getSubject())
                .orElseThrow(() -> new BadCredentialsException("Usuário do token JWT não encontrado"));
        return new UsernamePasswordAuthenticationToken(usuario, jwt, usuario.getAuthorities());
    }
}
