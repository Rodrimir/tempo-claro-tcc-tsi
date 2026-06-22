package com.rodrigo.backend2java.service;

import com.rodrigo.backend2java.config.JwtService;
import com.rodrigo.backend2java.model.Usuario;
import com.rodrigo.backend2java.model.dto.request.LoginRequestDTO;
import com.rodrigo.backend2java.model.dto.request.RegisterRequestDTO;
import com.rodrigo.backend2java.model.dto.response.AuthResponseDTO;
import com.rodrigo.backend2java.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.UUID;

// @audit-ok [Login (10) / Cadastro (10) — service de autenticação: valida credenciais, gera JWT e retorna AuthResponseDTO]

@Service
@RequiredArgsConstructor
public class AuthService {

        private final UsuarioRepository usuarioRepository;
        private final PasswordEncoder passwordEncoder;
        private final JwtService jwtService;

        public AuthResponseDTO autenticar(final LoginRequestDTO request) {
                // @audit-ok [Login (11) — busca usuário pelo email; lança IllegalArgumentException se não encontrado]
                final var usuario = usuarioRepository.findByEmail(request.email())
                                .orElseThrow(() -> new IllegalArgumentException("Erro credenciais invalidas!"));

                // @audit-ok [Login (12) — compara senha em texto puro com o hash BCrypt armazenado]
                if (!passwordEncoder.matches(request.password(), usuario.getSenhaHash())) {
                        throw new IllegalArgumentException("Erro credenciais invalidas!");
                }

                // @audit-ok [Login (13) — gera JWT assinado com HS256 com expiração de 24h]
                final var token = jwtService.generateToken(usuario.getEmail());

                // @audit-ok [Login (14) — constrói o DTO de resposta com token e dados básicos do usuário]
                return AuthResponseDTO.builder()
                                .token(token)
                                .user(AuthResponseDTO.UserDTO.builder()
                                                .name(usuario.getNome())
                                                .email(usuario.getEmail())
                                                .build())
                                .build();
        }

        public AuthResponseDTO cadastrar(final RegisterRequestDTO request) {
                // @audit-ok [Cadastro (11) — garante unicidade de e-mail antes de inserir]
                if (usuarioRepository.existsByEmail(request.email())) {
                        throw new RuntimeException("E-mail já está em uso");
                }

                // @audit-ok [Cadastro (12) — cria entidade Usuario com senha hash via BCrypt]
                final var novoUsuario = Usuario.builder()
                                .id(UUID.randomUUID())
                                .nome(request.nome())
                                .email(request.email())
                                .senhaHash(passwordEncoder.encode(request.password()))
                                .fusoHorario("America/Sao_Paulo")
                                .preferenciaIdioma("pt-BR")
                                .criadoEm(OffsetDateTime.now())
                                .build();

                // @audit-ok [Cadastro (13) — persiste o novo usuário no banco via JdbcTemplate]
                usuarioRepository.save(novoUsuario);

                // @audit-ok [Cadastro (14) — gera JWT e retorna DTO igual ao fluxo de login]
                final var token = jwtService.generateToken(novoUsuario.getEmail());

                return AuthResponseDTO.builder()
                                .token(token)
                                .user(AuthResponseDTO.UserDTO.builder()
                                                .name(novoUsuario.getNome())
                                                .email(novoUsuario.getEmail())
                                                .build())
                                .build();
        }
}
