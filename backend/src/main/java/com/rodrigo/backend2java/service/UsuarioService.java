package com.rodrigo.backend2java.service;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.rodrigo.backend2java.util.ZonaUsuario;
import com.rodrigo.backend2java.repository.UsuarioRepository;
import com.rodrigo.backend2java.model.dto.request.ProfileUpdateDTO;
import org.springframework.security.crypto.password.PasswordEncoder;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    // @audit-ok [Profile(2) — Service de perfil: PUT /api/profile]
    public void atualizarPerfil(final String emailContexto, final ProfileUpdateDTO request) {
        final var usuario = usuarioRepository.findByEmail(emailContexto)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        if (request.nome() != null && !request.nome().isBlank()) {
            usuario.setNome(request.nome());
        }

        // @audit-ok [E0.5.4 — só ZoneId.of() via ZonaUsuario.isValido(); um fuso que
        // não é identificador IANA (ex.: "BRT") vira RuntimeException, que o
        // GlobalExceptionHandler converte em 400 — nunca chega a ser salvo.]
        if (request.fuso_horario() != null && !request.fuso_horario().isBlank()) {
            if (!ZonaUsuario.isValido(request.fuso_horario())) {
                throw new RuntimeException("Fuso horário inválido: " + request.fuso_horario());
            }
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
