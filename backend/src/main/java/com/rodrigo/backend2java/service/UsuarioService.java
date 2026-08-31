package com.rodrigo.backend2java.service;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.rodrigo.backend2java.util.ZonaUsuario;
import com.rodrigo.backend2java.repository.UsuarioRepository;
import com.rodrigo.backend2java.model.dto.request.ProfileUpdateDTO;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.rodrigo.backend2java.model.dto.response.UsuarioResponseDTO;

@Service
@RequiredArgsConstructor
public class UsuarioService {

    // @audit-ok [E1.4 — mesmo mínimo que o front valida (Profile/index.jsx);
    // duplicado aqui porque "não confie só no cliente" (item 6 da tarefa) —
    // uma chamada direta à API (Postman, script) não pode gravar senha mais
    // curta que o formulário permitiria.]
    private static final int TAMANHO_MINIMO_SENHA = 8;

    // @audit-ok [E3.4 (item 2) — mesmo CHECK ck_usu_tema do schema v2.1.
    // Validado aqui, não com @Pattern no DTO, pra seguir o mesmo estilo que
    // fuso_horario/ZonaUsuario já usa neste service.]
    private static final Set<String> TEMAS_VALIDOS = Set.of("claro", "escuro", "sistema");

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    // @audit-ok [E1.5 — Service de GET /api/me: fonte de verdade do fuso_horario
    // salvo, para o Perfil não depender do que ficou em cache desde o login.]
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

        // @audit-ok [E3.4 (item 2) — mesmo padrão do bloco de fuso_horario
        // acima: valor fora de 'claro'/'escuro'/'sistema' vira RuntimeException
        // (400 legível via GlobalExceptionHandler) antes de chegar perto do
        // banco — o CHECK ck_usu_tema fica como backstop, não como o caminho
        // normal de validação.]
        if (request.tema() != null && !request.tema().isBlank()) {
            if (!TEMAS_VALIDOS.contains(request.tema())) {
                throw new RuntimeException("Tema inválido: " + request.tema());
            }
            usuario.setTema(request.tema());
        }

        // @audit-ok [E1.4 — mesmo bug do front, espelhado na API: enviar só
        // senha_atual (sem nova_senha) não fazia nada e ainda assim devolvia
        // sucesso, porque o bloco abaixo só entra quando nova_senha existe.
        // Fecha essa lacuna para quem chamar a API direto, sem passar pelo front.]
        if (request.senha_atual() != null && !request.senha_atual().isBlank()
                && (request.nova_senha() == null || request.nova_senha().isBlank())) {
            throw new RuntimeException("Preencha a nova senha para concluir a alteração.");
        }

        if (request.nova_senha() != null && !request.nova_senha().isBlank()) {
            if (request.senha_atual() == null || request.senha_atual().isBlank()) {
                throw new RuntimeException("Informe a senha atual para alterar a senha.");
            }
            // @audit-ok [E1.4 (item 6) — comprimento mínimo validado no servidor,
            // não só no formulário]
            if (request.nova_senha().length() < TAMANHO_MINIMO_SENHA) {
                throw new RuntimeException(
                        "A nova senha deve ter pelo menos " + TAMANHO_MINIMO_SENHA + " caracteres.");
            }
            if (!passwordEncoder.matches(request.senha_atual(), usuario.getSenhaHash())) {
                throw new RuntimeException("Senha atual incorreta");
            }
            usuario.setSenhaHash(passwordEncoder.encode(request.nova_senha()));
        }

        usuarioRepository.update(usuario);
    }
}
