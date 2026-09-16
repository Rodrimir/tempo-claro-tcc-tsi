package com.rodrigo.backend2java.autenticacao;
import java.util.UUID;
import java.time.OffsetDateTime;
import org.springframework.stereotype.Service;
import com.rodrigo.backend2java.usuario.Usuario;
import com.rodrigo.backend2java.infra.jwt.TokenService;
import com.rodrigo.backend2java.usuario.UsuarioRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.rodrigo.backend2java.infra.util.SenhaValidator;
import com.rodrigo.backend2java.infra.exception.RegraDeNegocioException;
import com.rodrigo.backend2java.infra.exception.RecursoNaoEncontradoException;
import com.rodrigo.backend2java.infra.exception.ValidacaoException;
import com.rodrigo.backend2java.infra.exception.MessageResponseDTO;
import com.rodrigo.backend2java.verificacao.CodigoVerificacaoService;
import com.rodrigo.backend2java.verificacao.EmailService;
import com.rodrigo.backend2java.verificacao.TipoCodigo;

@Service
public class AuthService {
        private static final java.util.Set<String> IDIOMAS_VALIDOS = java.util.Set.of("pt-BR", "en-US");

        private final UsuarioRepository usuarioRepository;
        private final PasswordEncoder passwordEncoder;
        private final AuthenticationManager authenticationManager;
        private final TokenService tokenService;
        private final CodigoVerificacaoService codigoVerificacaoService;
        private final EmailService emailService;

        public AuthService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder, AuthenticationManager authenticationManager, TokenService tokenService, CodigoVerificacaoService codigoVerificacaoService, EmailService emailService) {
            this.usuarioRepository = usuarioRepository;
            this.passwordEncoder = passwordEncoder;
            this.authenticationManager = authenticationManager;
            this.tokenService = tokenService;
            this.codigoVerificacaoService = codigoVerificacaoService;
            this.emailService = emailService;
        }
        // @audit-ok [Login(2) — service de autenticação: POST /auth/login]
        public AuthResponseDTO autenticar(final LoginRequestDTO request) {
                final var authenticationDTO = new UsernamePasswordAuthenticationToken(request.email(), request.password());
                final var authentication = authenticationManager.authenticate(authenticationDTO);
                final var usuario = (Usuario) authentication.getPrincipal();

                // @audit-info [Login(2) — gera JWT com expiração de 24h]
                final var token = tokenService.geraToken(usuario);

                // @audit-info [Login(2) — constrói o DTO de resposta com token e dados básicos do usuário]
                return AuthResponseDTO.builder()
                                .token(token)
                                .user(AuthResponseDTO.UserDTO.builder()
                                                .name(usuario.getNome())
                                                .email(usuario.getEmail())
                                                .fuso_horario(usuario.getFusoHorario())
                                                .tema(usuario.getTema())
                                                .preferencia_idioma(usuario.getPreferenciaIdioma())
                                                .build())
                                .build();
        }


        // @audit-ok [Cadastro(2) — service de autenticação: POST /auth/register]
        //
        // PLANO_REESTRUTURACAO.md, C — não emite token mais: o usuário nasce com
        // emailVerificado=false (default da entidade) e só ganha token em
        // verificarEmail, depois de confirmar o código. Devolver token aqui
        // permitiria usar a conta sem nunca validar o e-mail.
        public MessageResponseDTO cadastrar(final RegisterRequestDTO request) {
                // @audit-info [Cadastro(2) — garante unicidade de e-mail antes de inserir]
                if (usuarioRepository.existsByEmail(request.email())) {
                        throw new RegraDeNegocioException("E-mail já está em uso");
                }

                // Achado ao aplicar o PLANO_REESTRUTURACAO.md (D): este endpoint não
                // validava senha nenhuma antes desta linha — dava pra cadastrar com
                // senha de 1 caractere pela API, só o formulário do app impedia.
                final var motivoSenhaInvalida = SenhaValidator.motivoInvalida(request.password());
                if (motivoSenhaInvalida != null) {
                        throw new ValidacaoException(motivoSenhaInvalida);
                }

                // @audit-info [Cadastro(2) — cria entidade Usuario com senha hash via BCrypt]
                final var novoUsuario = Usuario.builder()
                                .id(UUID.randomUUID())
                                .nome(request.nome())
                                .email(request.email())
                                .senhaHash(passwordEncoder.encode(request.password()))
                                .fusoHorario("America/Sao_Paulo")
                                // Set.of(...).contains(null) lança NPE em vez de devolver false —
                                // preferencia_idioma() é opcional no DTO, então null é o caso comum.
                                .preferenciaIdioma(request.preferencia_idioma() != null
                                                && IDIOMAS_VALIDOS.contains(request.preferencia_idioma())
                                                ? request.preferencia_idioma()
                                                : "pt-BR")
                                .criadoEm(OffsetDateTime.now())
                                .build();

                usuarioRepository.save(novoUsuario);

                final var codigo = codigoVerificacaoService.gerarCodigo(novoUsuario.getEmail(), TipoCodigo.VERIFICACAO_EMAIL);
                emailService.enviarCodigo(novoUsuario.getEmail(), codigo, TipoCodigo.VERIFICACAO_EMAIL, novoUsuario.getPreferenciaIdioma());

                return MessageResponseDTO.builder().success(true)
                                .message("Cadastro recebido! Enviamos um código de verificação para o seu e-mail.")
                                .build();
        }

        // PLANO_REESTRUTURACAO.md, C — confirma o código emitido em cadastrar() e
        // só aqui emite o primeiro token: é o único jeito de "logar" uma conta
        // recém-criada, porque autenticar() rejeitaria (isEnabled()==false) até
        // este ponto.
        public AuthResponseDTO verificarEmail(final VerifyEmailRequestDTO request) {
                codigoVerificacaoService.validarCodigo(request.email(), request.codigo(), TipoCodigo.VERIFICACAO_EMAIL);

                final var usuario = usuarioRepository.findByEmail(request.email())
                                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário não encontrado."));
                usuario.setEmailVerificado(true);
                usuarioRepository.save(usuario);

                final var token = tokenService.geraToken(usuario);

                return AuthResponseDTO.builder()
                                .token(token)
                                .user(AuthResponseDTO.UserDTO.builder()
                                                .name(usuario.getNome())
                                                .email(usuario.getEmail())
                                                .fuso_horario(usuario.getFusoHorario())
                                                .tema(usuario.getTema())
                                                .preferencia_idioma(usuario.getPreferenciaIdioma())
                                                .build())
                                .build();
        }

        // PLANO_REESTRUTURACAO.md, C — pedir de novo invalida o código anterior
        // (CodigoVerificacaoService.gerarCodigo já faz isso), então não há risco
        // de dois códigos válidos ao mesmo tempo para o mesmo e-mail.
        public MessageResponseDTO reenviarCodigoVerificacao(final ResendCodeRequestDTO request) {
                final var usuario = usuarioRepository.findByEmail(request.email())
                                .orElseThrow(() -> new RecursoNaoEncontradoException("E-mail não encontrado."));
                if (usuario.isEmailVerificado()) {
                        throw new RegraDeNegocioException("E-mail já verificado. Você já pode entrar.");
                }

                final var codigo = codigoVerificacaoService.gerarCodigo(usuario.getEmail(), TipoCodigo.VERIFICACAO_EMAIL);
                emailService.enviarCodigo(usuario.getEmail(), codigo, TipoCodigo.VERIFICACAO_EMAIL, usuario.getPreferenciaIdioma());

                return MessageResponseDTO.builder().success(true).message("Novo código enviado.").build();
        }

        // PLANO_REESTRUTURACAO.md, B — sempre 200 com a mesma mensagem, exista ou
        // não o e-mail: diferenciar a resposta deixaria qualquer um descobrir,
        // testando e-mails, quais estão cadastrados (anti-enumeração).
        public MessageResponseDTO esqueciSenha(final ForgotPasswordRequestDTO request) {
                usuarioRepository.findByEmail(request.email()).ifPresent(usuario -> {
                        try {
                                final var codigo = codigoVerificacaoService.gerarCodigo(usuario.getEmail(), TipoCodigo.RECUPERACAO_SENHA);
                                emailService.enviarCodigo(usuario.getEmail(), codigo, TipoCodigo.RECUPERACAO_SENHA, usuario.getPreferenciaIdioma());
                        } catch (RegraDeNegocioException throttleDoReenvio) {
                                // gerarCodigo recusa por causa do throttle de 60s (B.2). Engolir de
                                // propósito: se vazasse como 422 aqui, alguém batendo forgot-password
                                // duas vezes rápido no MESMO e-mail descobriria que ele existe — a
                                // resposta sempre-200 é justamente o que evita isso.
                        }
                });

                return MessageResponseDTO.builder().success(true)
                                .message("Se este e-mail estiver cadastrado, enviamos um código de recuperação.")
                                .build();
        }

        // PLANO_REESTRUTURACAO.md, B.2 — "200 + token": redefinir já loga, mesmo
        // padrão de verificarEmail (confirmar posse do código também basta pra
        // abrir sessão, não só pra trocar a senha).
        public AuthResponseDTO redefinirSenha(final ResetPasswordRequestDTO request) {
                // A força da senha é checada ANTES de validar o código de propósito:
                // validarCodigo já marca o código como usado a partir do primeiro
                // acerto (CodigoVerificacaoService.validarCodigo). Se a ordem fosse
                // invertida, uma senha fraca queimaria um código que ainda era válido
                // — a pessoa precisaria pedir recuperação de novo só por causa de
                // uma senha rejeitada, para um código que nem chegou a ser usado.
                final var motivoSenhaInvalida = SenhaValidator.motivoInvalida(request.nova_senha());
                if (motivoSenhaInvalida != null) {
                        throw new ValidacaoException(motivoSenhaInvalida);
                }

                codigoVerificacaoService.validarCodigo(request.email(), request.codigo(), TipoCodigo.RECUPERACAO_SENHA);

                final var usuario = usuarioRepository.findByEmail(request.email())
                                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário não encontrado."));
                usuario.setSenhaHash(passwordEncoder.encode(request.nova_senha()));
                // Receber e digitar o código de recuperação prova posse da caixa de
                // e-mail no mesmo grau que o código de verificação de cadastro prova
                // — sem isto, uma conta que nunca terminou de verificar o e-mail
                // ganharia um token válido aqui (JWT não confere isEnabled() de novo
                // nas próximas requisições) mas continuaria com usu_email_verificado
                // = false, e um login normal logo depois voltaria a cair no 403.
                usuario.setEmailVerificado(true);
                usuarioRepository.save(usuario);

                final var token = tokenService.geraToken(usuario);

                return AuthResponseDTO.builder()
                                .token(token)
                                .user(AuthResponseDTO.UserDTO.builder()
                                                .name(usuario.getNome())
                                                .email(usuario.getEmail())
                                                .fuso_horario(usuario.getFusoHorario())
                                                .tema(usuario.getTema())
                                                .preferencia_idioma(usuario.getPreferenciaIdioma())
                                                .build())
                                .build();
        }
}
