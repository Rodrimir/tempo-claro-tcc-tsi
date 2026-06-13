package com.rodrigo.backend2java.service;

import com.rodrigo.backend2java.model.dto.request.ProfileUpdateDTO;
import com.rodrigo.backend2java.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public void atualizarPerfil(final String emailContexto, final ProfileUpdateDTO request) {
        final var usuario = usuarioRepository.findByEmail(emailContexto)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        
        if (request.nome() != null && !request.nome().isBlank()) {
            usuario.setNome(request.nome());
        }

        if (request.fuso_horario() != null && !request.fuso_horario().isBlank()) {
            usuario.setFusoHorario(request.fuso_horario());
        }

        if (request.nova_senha() != null && !request.nova_senha().isBlank()) {
            if (request.senha_atual() == null || request.senha_atual().isBlank()) {
                throw new RuntimeException("A senha atual é necessária para definir uma nova senha");
            }
            if (!passwordEncoder.matches(request.senha_atual(), usuario.getSenhaHash())) {
                throw new RuntimeException("Senha atual incorreta");
            }
            usuario.setSenhaHash(passwordEncoder.encode(request.nova_senha()));
        }
        
        usuarioRepository.update(usuario);
    }
}