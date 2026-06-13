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

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthResponseDTO autenticar(final LoginRequestDTO request) {
        final var usuario = usuarioRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("Erro credenciais invalidas!"));

        if (!passwordEncoder.matches(request.password(), usuario.getSenhaHash())) {
            throw new IllegalArgumentException("Erro credenciais invalidas!");
        }

        final var token = jwtService.generateToken(usuario.getEmail());

        return AuthResponseDTO.builder()
                .token(token)
                .user(AuthResponseDTO.UserDTO.builder()
                        .name(usuario.getNome())
                        .email(usuario.getEmail())
                        .build())
                .build();
    }

    public AuthResponseDTO cadastrar(final RegisterRequestDTO request) {
        if (usuarioRepository.existsByEmail(request.email())) {
            throw new RuntimeException("E-mail já está em uso");
        }

        final var novoUsuario = Usuario.builder()
                .id(UUID.randomUUID())
                .nome(request.nome())
                .email(request.email())
                .senhaHash(passwordEncoder.encode(request.password()))
                .fusoHorario("America/Sao_Paulo")
                .preferenciaIdioma("pt-BR")
                .criadoEm(OffsetDateTime.now())
                .build();

        usuarioRepository.save(novoUsuario);

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