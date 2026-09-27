package com.rodrigo.backend2java.usuario;
import java.util.Set;
import org.springframework.stereotype.Service;
import com.rodrigo.backend2java.infra.util.ZonaUsuario;
import com.rodrigo.backend2java.infra.util.SenhaValidator;
import com.rodrigo.backend2java.infra.exception.ValidacaoException;
import com.rodrigo.backend2java.infra.exception.RegraDeNegocioException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import com.rodrigo.backend2java.usuario.model.ProfileUpdateDTO;
import com.rodrigo.backend2java.usuario.model.UsuarioResponseDTO;

@Service
public class UsuarioService {

    private static final Set<String> TEMAS_VALIDOS = Set.of("claro", "escuro", "sistema", "dinamico");

    private static final Set<String> IDIOMAS_VALIDOS = Set.of("pt-BR", "en-US");

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public UsuarioResponseDTO buscarPerfil(final String emailContexto) {
        final var usuario = usuarioRepository.findByEmail(emailContexto)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        return UsuarioResponseDTO.builder()
                .id(usuario.getId())
                .nome(usuario.getNome())
                .email(usuario.getEmail())
                .fuso_horario(usuario.getFusoHorario())
                .preferencia_idioma(usuario.getPreferenciaIdioma())
                .tema(usuario.getTema())
                .build();
    }

    @Transactional
    public void atualizarPerfil(final String emailContexto, final ProfileUpdateDTO request) {
        final var usuario = usuarioRepository.findByEmail(emailContexto)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        if (request.nome() != null && !request.nome().isBlank()) {
            usuario.setNome(request.nome());
        }

        if (request.fuso_horario() != null && !request.fuso_horario().isBlank()) {
            if (!ZonaUsuario.isValido(request.fuso_horario())) {
                throw new ValidacaoException("Fuso horário inválido: " + request.fuso_horario());
            }
            usuario.setFusoHorario(request.fuso_horario());
        }

        if (request.tema() != null && !request.tema().isBlank()) {
            if (!TEMAS_VALIDOS.contains(request.tema())) {
                throw new ValidacaoException("Tema inválido: " + request.tema());
            }
            usuario.setTema(request.tema());
        }

        if (request.preferencia_idioma() != null && !request.preferencia_idioma().isBlank()) {
            if (!IDIOMAS_VALIDOS.contains(request.preferencia_idioma())) {
                throw new ValidacaoException("Idioma inválido: " + request.preferencia_idioma());
            }
            usuario.setPreferenciaIdioma(request.preferencia_idioma());
        }

        if (request.senha_atual() != null && !request.senha_atual().isBlank()
                && (request.nova_senha() == null || request.nova_senha().isBlank())) {
            throw new ValidacaoException("Preencha a nova senha para concluir a alteração.");
        }

        if (request.nova_senha() != null && !request.nova_senha().isBlank()) {
            if (request.senha_atual() == null || request.senha_atual().isBlank()) {
                throw new ValidacaoException("Informe a senha atual para alterar a senha.");
            }
            final var motivoSenhaInvalida = SenhaValidator.motivoInvalida(request.nova_senha());
            if (motivoSenhaInvalida != null) {
                throw new ValidacaoException(motivoSenhaInvalida);
            }
            if (!passwordEncoder.matches(request.senha_atual(), usuario.getSenhaHash())) {
                throw new RegraDeNegocioException("Senha atual incorreta");
            }
            usuario.setSenhaHash(passwordEncoder.encode(request.nova_senha()));
        }

        usuarioRepository.atualizarPerfil(usuario.getId(), usuario.getNome(), usuario.getEmail(),
                usuario.getSenhaHash(), usuario.getFusoHorario(), usuario.getPreferenciaIdioma(),
                usuario.getTema());
    }
}
