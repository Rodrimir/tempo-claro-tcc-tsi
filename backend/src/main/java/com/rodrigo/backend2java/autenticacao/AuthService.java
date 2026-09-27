package com.rodrigo.backend2java.autenticacao;
import java.util.UUID;
import java.time.OffsetDateTime;
import org.springframework.stereotype.Service;
import com.rodrigo.backend2java.usuario.model.Usuario;
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
import com.rodrigo.backend2java.verificacao.model.TipoCodigo;
import com.rodrigo.backend2java.autenticacao.model.AuthResponseDTO;
import com.rodrigo.backend2java.autenticacao.model.LoginRequestDTO;
import com.rodrigo.backend2java.autenticacao.model.RegisterRequestDTO;
import com.rodrigo.backend2java.autenticacao.model.ResendCodeRequestDTO;
import com.rodrigo.backend2java.autenticacao.model.VerifyEmailRequestDTO;
import com.rodrigo.backend2java.autenticacao.model.ResetPasswordRequestDTO;
import com.rodrigo.backend2java.autenticacao.model.ForgotPasswordRequestDTO;

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
        public AuthResponseDTO autenticar(final LoginRequestDTO request) {
                final var authenticationDTO = new UsernamePasswordAuthenticationToken(request.email(), request.password());
                final var authentication = authenticationManager.authenticate(authenticationDTO);
                final var usuario = (Usuario) authentication.getPrincipal();

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


        public MessageResponseDTO cadastrar(final RegisterRequestDTO request) {
                if (usuarioRepository.existsByEmail(request.email())) {
                        throw new RegraDeNegocioException("E-mail já está em uso");
                }

                final var motivoSenhaInvalida = SenhaValidator.motivoInvalida(request.password());
                if (motivoSenhaInvalida != null) {
                        throw new ValidacaoException(motivoSenhaInvalida);
                }

                final var novoUsuario = Usuario.builder()
                                .id(UUID.randomUUID())
                                .nome(request.nome())
                                .email(request.email())
                                .senhaHash(passwordEncoder.encode(request.password()))
                                .fusoHorario("America/Sao_Paulo")
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

        public MessageResponseDTO esqueciSenha(final ForgotPasswordRequestDTO request) {
                usuarioRepository.findByEmail(request.email()).ifPresent(usuario -> {
                        try {
                                final var codigo = codigoVerificacaoService.gerarCodigo(usuario.getEmail(), TipoCodigo.RECUPERACAO_SENHA);
                                emailService.enviarCodigo(usuario.getEmail(), codigo, TipoCodigo.RECUPERACAO_SENHA, usuario.getPreferenciaIdioma());
                        } catch (RegraDeNegocioException throttleDoReenvio) {
                        }
                });

                return MessageResponseDTO.builder().success(true)
                                .message("Se este e-mail estiver cadastrado, enviamos um código de recuperação.")
                                .build();
        }

        public AuthResponseDTO redefinirSenha(final ResetPasswordRequestDTO request) {
                final var motivoSenhaInvalida = SenhaValidator.motivoInvalida(request.nova_senha());
                if (motivoSenhaInvalida != null) {
                        throw new ValidacaoException(motivoSenhaInvalida);
                }

                codigoVerificacaoService.validarCodigo(request.email(), request.codigo(), TipoCodigo.RECUPERACAO_SENHA);

                final var usuario = usuarioRepository.findByEmail(request.email())
                                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário não encontrado."));
                usuario.setSenhaHash(passwordEncoder.encode(request.nova_senha()));
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
