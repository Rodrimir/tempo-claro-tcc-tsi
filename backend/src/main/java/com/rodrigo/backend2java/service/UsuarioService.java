package com.rodrigo.backend2java.service;

import com.rodrigo.backend2java.model.dto.request.ProfileUpdateDTO;
import com.rodrigo.backend2java.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

// @audit-ok [Perfil (9) — service de usuário: atualiza nome, fuso horário e senha com verificação BCrypt]

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public void atualizarPerfil(final String emailContexto, final ProfileUpdateDTO request) {
        // @audit-ok [Perfil (10) — busca usuário pelo email extraído do JWT]
        final var usuario = usuarioRepository.findByEmail(emailContexto)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        // @audit-ok [Perfil (11) — atualiza nome apenas se fornecido e não vazio]
        if (request.nome() != null && !request.nome().isBlank()) {
            usuario.setNome(request.nome());
        }

        // @audit-ok [Perfil (12) — atualiza fuso horário apenas se fornecido e não vazio]
        if (request.fuso_horario() != null && !request.fuso_horario().isBlank()) {
            usuario.setFusoHorario(request.fuso_horario());
        }

        // @audit-ok [Perfil (13) — valida senha_atual com BCrypt antes de permitir troca de senha]
        if (request.nova_senha() != null && !request.nova_senha().isBlank()) {
            if (request.senha_atual() == null || request.senha_atual().isBlank()) {
                throw new RuntimeException("A senha atual é necessária para definir uma nova senha");
            }
            if (!passwordEncoder.matches(request.senha_atual(), usuario.getSenhaHash())) {
                throw new RuntimeException("Senha atual incorreta");
            }
            // @audit-ok [Perfil (14) — encripta nova senha com BCrypt antes de persistir]
            usuario.setSenhaHash(passwordEncoder.encode(request.nova_senha()));
        }

        usuarioRepository.update(usuario);
    }
}
