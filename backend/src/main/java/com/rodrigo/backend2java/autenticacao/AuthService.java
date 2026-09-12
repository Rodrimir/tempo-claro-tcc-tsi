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
import com.rodrigo.backend2java.infra.exception.RegraDeNegocioException;

@Service
public class AuthService {
        private static final java.util.Set<String> IDIOMAS_VALIDOS = java.util.Set.of("pt-BR", "en-US");

        private final UsuarioRepository usuarioRepository;
        private final PasswordEncoder passwordEncoder;
        private final AuthenticationManager authenticationManager;
        private final TokenService tokenService;

        public AuthService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder, AuthenticationManager authenticationManager, TokenService tokenService) {
            this.usuarioRepository = usuarioRepository;
            this.passwordEncoder = passwordEncoder;
            this.authenticationManager = authenticationManager;
            this.tokenService = tokenService;
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
        public AuthResponseDTO cadastrar(final RegisterRequestDTO request) {
                // @audit-info [Cadastro(2) — garante unicidade de e-mail antes de inserir]
                if (usuarioRepository.existsByEmail(request.email())) {
                        throw new RegraDeNegocioException("E-mail já está em uso");
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

                // @audit-info [Cadastro(2) — gera JWT e retorna DTO igual ao fluxo de login]
                final var token = tokenService.geraToken(novoUsuario);

                return AuthResponseDTO.builder()
                                .token(token)
                                .user(AuthResponseDTO.UserDTO.builder()
                                                .name(novoUsuario.getNome())
                                                .email(novoUsuario.getEmail())
                                                .fuso_horario(novoUsuario.getFusoHorario())
                                                .tema(novoUsuario.getTema())
                                                .preferencia_idioma(novoUsuario.getPreferenciaIdioma())
                                                .build())
                                .build();
        }
}
