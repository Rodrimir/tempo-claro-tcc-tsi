package com.rodrigo.backend2java.service;

import java.util.UUID;
import java.time.OffsetDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.rodrigo.backend2java.model.Usuario;
import com.rodrigo.backend2java.config.JwtService;
import com.rodrigo.backend2java.repository.UsuarioRepository;
import com.rodrigo.backend2java.model.dto.request.LoginRequestDTO;
import com.rodrigo.backend2java.model.dto.response.AuthResponseDTO;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.rodrigo.backend2java.model.dto.request.RegisterRequestDTO;

@Service
@RequiredArgsConstructor
public class AuthService {
        private final UsuarioRepository usuarioRepository;
        private final PasswordEncoder passwordEncoder;
        private final JwtService jwtService;
        // @audit-ok [Login(2) — service de autenticação: POST /auth/login]
        public AuthResponseDTO autenticar(final LoginRequestDTO request) {
                // @audit-info [Login(2) — busca usuário pelo email; lança IllegalArgumentException se não encontrado]
                final var usuario = usuarioRepository.findByEmail(request.email())
                                .orElseThrow(() -> new IllegalArgumentException("Erro credenciais invalidas!"));

                // @audit-info [Login(2) — compara senha em texto puro com o hash BCrypt armazenado]
                if (!passwordEncoder.matches(request.password(), usuario.getSenhaHash())) {
                        throw new IllegalArgumentException("Erro credenciais invalidas!");
                }

                // @audit-info [Login(2) — gera JWT assinado com HS256 com expiração de 24h]
                final var token = jwtService.generateToken(usuario.getEmail());

                // @audit-info [Login(2) — constrói o DTO de resposta com token e dados do usuário]
                return AuthResponseDTO.builder()
                                .token(token)
                                .user(AuthResponseDTO.UserDTO.builder()
                                                .name(usuario.getNome())
                                                .email(usuario.getEmail())
                                                .fusoHorario(usuario.getFusoHorario())
                                                .preferenciaIdioma(usuario.getPreferenciaIdioma())
                                                .build())
                                .build();
        }


        // @audit-ok [Cadastro(2) — service de autenticação: POST /auth/register]
        public AuthResponseDTO cadastrar(final RegisterRequestDTO request) {
                // @audit-info [Cadastro(2) — garante unicidade de e-mail antes de inserir]
                if (usuarioRepository.existsByEmail(request.email())) {
                        throw new RuntimeException("E-mail já está em uso");
                }

                // @audit-info [Cadastro(2) — cria entidade Usuario com senha hash via BCrypt]
                final var novoUsuario = Usuario.builder()
                                .id(UUID.randomUUID())
                                .nome(request.nome())
                                .email(request.email())
                                .senhaHash(passwordEncoder.encode(request.password()))
                                .fusoHorario("America/Sao_Paulo")
                                .preferenciaIdioma("pt-BR")
                                .criadoEm(OffsetDateTime.now())
                                .build();

                // @audit-info [Cadastro(2) — persiste o novo usuário no banco via JdbcTemplate]
                usuarioRepository.save(novoUsuario);

                // @audit-info [Cadastro(2) — gera JWT e retorna DTO igual ao fluxo de login]
                final var token = jwtService.generateToken(novoUsuario.getEmail());

                return AuthResponseDTO.builder()
                                .token(token)
                                .user(AuthResponseDTO.UserDTO.builder()
                                                .name(novoUsuario.getNome())
                                                .email(novoUsuario.getEmail())
                                                .fusoHorario(novoUsuario.getFusoHorario())
                                                .preferenciaIdioma(novoUsuario.getPreferenciaIdioma())
                                                .build())
                                .build();
        }
}
