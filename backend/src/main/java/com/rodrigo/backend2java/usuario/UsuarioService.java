package com.rodrigo.backend2java.usuario;
import java.util.Set;
import org.springframework.stereotype.Service;
import com.rodrigo.backend2java.infra.util.ZonaUsuario;
import com.rodrigo.backend2java.infra.exception.ValidacaoException;
import com.rodrigo.backend2java.infra.exception.RegraDeNegocioException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

@Service
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

    /**
     * Os idiomas para os quais existe conteúdo — não basta a interface traduzir:
     * biblioteca_textos precisa ter linha para (categoria, idioma), senão o
     * priming cairia no texto padrão. Aceitar um idioma sem seed seria prometer
     * uma tradução que o servidor não tem.
     */
    private static final Set<String> IDIOMAS_VALIDOS = Set.of("pt-BR", "en-US");

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

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
    @Transactional
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
                throw new ValidacaoException("Fuso horário inválido: " + request.fuso_horario());
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
                throw new ValidacaoException("Tema inválido: " + request.tema());
            }
            usuario.setTema(request.tema());
        }

        // Mesmo padrão do tema e do fuso: valida antes de chegar no banco.
        if (request.preferencia_idioma() != null && !request.preferencia_idioma().isBlank()) {
            if (!IDIOMAS_VALIDOS.contains(request.preferencia_idioma())) {
                throw new ValidacaoException("Idioma inválido: " + request.preferencia_idioma());
            }
            usuario.setPreferenciaIdioma(request.preferencia_idioma());
        }

        // @audit-ok [E1.4 — mesmo bug do front, espelhado na API: enviar só
        // senha_atual (sem nova_senha) não fazia nada e ainda assim devolvia
        // sucesso, porque o bloco abaixo só entra quando nova_senha existe.
        // Fecha essa lacuna para quem chamar a API direto, sem passar pelo front.]
        if (request.senha_atual() != null && !request.senha_atual().isBlank()
                && (request.nova_senha() == null || request.nova_senha().isBlank())) {
            throw new ValidacaoException("Preencha a nova senha para concluir a alteração.");
        }

        if (request.nova_senha() != null && !request.nova_senha().isBlank()) {
            if (request.senha_atual() == null || request.senha_atual().isBlank()) {
                throw new ValidacaoException("Informe a senha atual para alterar a senha.");
            }
            // @audit-ok [E1.4 (item 6) — comprimento mínimo validado no servidor,
            // não só no formulário]
            if (request.nova_senha().length() < TAMANHO_MINIMO_SENHA) {
                throw new ValidacaoException(
                        "A nova senha deve ter pelo menos " + TAMANHO_MINIMO_SENHA + " caracteres.");
            }
            if (!passwordEncoder.matches(request.senha_atual(), usuario.getSenhaHash())) {
                // 422, e não 401: a sessão é válida — quem falhou foi a regra "só
                // troca a senha quem souber a atual". Com 401, o aplicativo trataria
                // como token expirado e derrubaria a sessão inteira por causa de um
                // erro de digitação.
                throw new RegraDeNegocioException("Senha atual incorreta");
            }
            usuario.setSenhaHash(passwordEncoder.encode(request.nova_senha()));
        }

        usuarioRepository.atualizarPerfil(usuario.getId(), usuario.getNome(), usuario.getEmail(),
                usuario.getSenhaHash(), usuario.getFusoHorario(), usuario.getPreferenciaIdioma(),
                usuario.getTema());
    }
}
