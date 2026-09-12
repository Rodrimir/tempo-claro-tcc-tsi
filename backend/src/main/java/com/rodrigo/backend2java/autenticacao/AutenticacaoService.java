package com.rodrigo.backend2java.autenticacao;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import com.rodrigo.backend2java.usuario.UsuarioRepository;

/**
 * O {@code UserDetailsService} que o {@code AuthenticationManager} usa no login.
 * Não é injetado em lugar nenhum de propósito: o Spring Security o resolve por ser
 * o único do contexto.
 *
 * <p>v3.0: usava {@code AutenticacaoRepository}, um segundo repositório de
 * {@code Usuario} que só declarava {@code findByEmail} — exatamente o método que
 * {@code UsuarioRepository} já tinha. A duplicata saiu.
 */
@Service
public class AutenticacaoService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;

    public AutenticacaoService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return usuarioRepository.findByEmail(username)
                .orElseThrow(() -> new UsernameNotFoundException(username));
    }
}
