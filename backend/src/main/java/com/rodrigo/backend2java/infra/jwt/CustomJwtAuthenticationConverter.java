package com.rodrigo.backend2java.infra.jwt;

import com.rodrigo.backend2java.usuario.UsuarioRepository;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

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
