package com.rodrigo.backend2java.integration;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;

import com.rodrigo.backend2java.BaseAPIIntegracaoTest;
import com.rodrigo.backend2java.autenticacao.LoginRequestDTO;
import com.rodrigo.backend2java.autenticacao.RegisterRequestDTO;
import com.rodrigo.backend2java.autenticacao.AuthResponseDTO;
import com.rodrigo.backend2java.infra.exception.MessageResponseDTO;
import com.rodrigo.backend2java.usuario.UsuarioRepository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AutenticacaoIntegracaoTest extends BaseAPIIntegracaoTest {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Test
    void cadastro_persisteUsuarioComSenhaHasheada() {
        final var email = "cadastro-" + UUID.randomUUID() + "@tempoclaro.test";
        final var request = RegisterRequestDTO.builder()
                .nome("Novo Usuário")
                .email(email)
                .password("Senha@123")
                .build();

        final var resposta = post("/api/auth/register", request, AuthResponseDTO.class);

        assertEquals(HttpStatus.CREATED, resposta.getStatusCode());
        assertNotNull(resposta.getBody().token());
        assertEquals(email, resposta.getBody().user().email());

        final var usuarioNoBanco = usuarioRepository.findByEmail(email).orElseThrow();
        assertNotNull(usuarioNoBanco.getSenhaHash());
        assertTrue(usuarioNoBanco.getSenhaHash().startsWith("$2"));
        assertEquals("Novo Usuário", usuarioNoBanco.getNome());
    }

    @Test
    void cadastro_comEmailJaExistente_retorna422() {
        final var email = "duplicado-" + UUID.randomUUID() + "@tempoclaro.test";
        final var request = RegisterRequestDTO.builder()
                .nome("Primeiro")
                .email(email)
                .password("Senha@123")
                .build();
        post("/api/auth/register", request, AuthResponseDTO.class);

        final var segundaTentativa = post("/api/auth/register", request, MessageResponseDTO.class);

        // §5.1: e-mail já cadastrado é regra de negócio (422), não erro de formato.
        assertEquals(422, segundaTentativa.getStatusCode().value());
        assertEquals(1, usuarioRepository.findByEmail(email).stream().count());
    }

    @Test
    void login_comCredenciaisCorretas_devolveTokenValido() {
        final var email = "login-" + UUID.randomUUID() + "@tempoclaro.test";
        final var senha = "Senha@123";
        post("/api/auth/register", RegisterRequestDTO.builder()
                .nome("Login Teste").email(email).password(senha).build(), AuthResponseDTO.class);

        final var resposta = post("/api/auth/login",
                LoginRequestDTO.builder().email(email).password(senha).build(), AuthResponseDTO.class);

        assertEquals(HttpStatus.OK, resposta.getStatusCode());
        assertNotNull(resposta.getBody().token());
    }

    @Test
    void login_comSenhaErrada_retorna401() {
        final var email = "senhaerrada-" + UUID.randomUUID() + "@tempoclaro.test";
        post("/api/auth/register", RegisterRequestDTO.builder()
                .nome("X").email(email).password("Senha@123").build(), AuthResponseDTO.class);

        final var resposta = post("/api/auth/login",
                LoginRequestDTO.builder().email(email).password("SenhaErrada@1").build(), MessageResponseDTO.class);

        assertEquals(HttpStatus.UNAUTHORIZED, resposta.getStatusCode());
    }

    @Test
    void login_comEmailInexistente_retorna401() {
        final var resposta = post("/api/auth/login",
                LoginRequestDTO.builder()
                        .email("nao-existe-" + UUID.randomUUID() + "@tempoclaro.test")
                        .password("QualquerSenha@1")
                        .build(),
                MessageResponseDTO.class);

        assertEquals(HttpStatus.UNAUTHORIZED, resposta.getStatusCode());
        assertEquals("Erro credenciais invalidas!", resposta.getBody().message());
    }
}
