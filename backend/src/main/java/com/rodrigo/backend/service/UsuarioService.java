package com.rodrigo.backend.service;

import com.rodrigo.backend.model.dto.request.ProfileUpdateDTO;
import com.rodrigo.backend.model.dto.request.AccountDeleteDTO;
import com.rodrigo.backend.repository.UsuarioRepository;
import com.rodrigo.backend.exception.RegraNegocioException;
import com.rodrigo.backend.exception.RecursoNaoEncontradoException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    // @audit-ok [Profile(2) — Service de perfil: PUT /api/profile]
    @Transactional
    public void atualizarPerfil(final String emailContexto, final ProfileUpdateDTO request) {
        final var usuario = usuarioRepository.findByEmail(emailContexto)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário não encontrado"));

        if (request.nome() != null && !request.nome().isBlank()) {
            usuario.setNome(request.nome());
        }

        if (request.fuso_horario() != null && !request.fuso_horario().isBlank()) {
            usuario.setFusoHorario(request.fuso_horario());
        }

        if (request.nova_senha() != null && !request.nova_senha().isBlank()) {
            if (request.senha_atual() == null || request.senha_atual().isBlank()) {
                throw new RegraNegocioException("A senha atual é necessária para definir uma nova senha");
            }
            if (!passwordEncoder.matches(request.senha_atual(), usuario.getSenhaHash())) {
                throw new RegraNegocioException("Senha atual incorreta");
            }
            usuario.setSenhaHash(passwordEncoder.encode(request.nova_senha()));
        }

        usuarioRepository.update(usuario);
    }

    // @audit-ok [Excluir Conta(2) — Service de perfil: DELETE /api/profile; exige a senha do usuário antes de remover a conta]
    @Transactional
    public void excluirConta(final String emailContexto, final AccountDeleteDTO request) {
        final var usuario = usuarioRepository.findByEmail(emailContexto)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário não encontrado"));

        // @audit-info [Excluir Conta(2) — a senha é obrigatória para confirmar a exclusão (ação destrutiva e irreversível)]
        if (request == null || request.password() == null || request.password().isBlank()) {
            throw new RegraNegocioException("A senha é necessária para excluir a conta");
        }

        // @audit-info [Excluir Conta(2) — confirma a identidade comparando a senha informada com o hash BCrypt]
        if (!passwordEncoder.matches(request.password(), usuario.getSenhaHash())) {
            throw new RegraNegocioException("Senha incorreta");
        }

        // @audit-info [Excluir Conta(2) — DELETE em usuarios; ON DELETE CASCADE remove hábitos, execuções, transações e demais fatos do usuário]
        usuarioRepository.delete(usuario.getId());
    }
}
