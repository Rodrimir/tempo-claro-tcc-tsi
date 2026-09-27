package com.rodrigo.backend2java.integration;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;

import com.rodrigo.backend2java.BaseAPIIntegracaoTest;
import com.rodrigo.backend2java.autenticacao.model.LoginRequestDTO;
import com.rodrigo.backend2java.autenticacao.model.RegisterRequestDTO;
import com.rodrigo.backend2java.autenticacao.model.AuthResponseDTO;
import com.rodrigo.backend2java.autenticacao.model.VerifyEmailRequestDTO;
import com.rodrigo.backend2java.infra.exception.MessageResponseDTO;
import com.rodrigo.backend2java.usuario.UsuarioRepository;
import com.rodrigo.backend2java.verificacao.model.TipoCodigo;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AutenticacaoIntegracaoTest extends BaseAPIIntegracaoTest {

    @Autowired
    private UsuarioRepository usuarioRepository;

    private void registrarEVerificar(final String email, final String senha, final String nome) {
        post("/api/auth/register",
                RegisterRequestDTO.builder().nome(nome).email(email).password(senha).build(),
                MessageResponseDTO.class);

        final var codigo = fakeEmailService.ultimoCodigo(email, TipoCodigo.VERIFICACAO_EMAIL);
        assertNotNull(codigo);
        post("/api/auth/verify-email",
                VerifyEmailRequestDTO.builder().email(email).codigo(codigo).build(),
                AuthResponseDTO.class);
    }

    @Test
    void cadastro_persisteUsuarioComSenhaHasheada() {
        final var email = "cadastro-" + UUID.randomUUID() + "@tempoclaro.test";
        final var request = RegisterRequestDTO.builder()
                .nome("Novo Usuário")
                .email(email)
                .password("Senha@123")
                .build();

        final var resposta = post("/api/auth/register", request, MessageResponseDTO.class);

        assertEquals(HttpStatus.CREATED, resposta.getStatusCode());
        assertTrue(resposta.getBody().success());

        final var usuarioNoBanco = usuarioRepository.findByEmail(email).orElseThrow();
        assertNotNull(usuarioNoBanco.getSenhaHash());
        assertTrue(usuarioNoBanco.getSenhaHash().startsWith("$2"));
        assertEquals("Novo Usuário", usuarioNoBanco.getNome());
        assertEquals(false, usuarioNoBanco.isEmailVerificado());
    }

    @Test
    void cadastro_comEmailJaExistente_retorna422() {
        final var email = "duplicado-" + UUID.randomUUID() + "@tempoclaro.test";
        final var request = RegisterRequestDTO.builder()
                .nome("Primeiro")
                .email(email)
                .password("Senha@123")
                .build();
        post("/api/auth/register", request, MessageResponseDTO.class);

        final var segundaTentativa = post("/api/auth/register", request, MessageResponseDTO.class);

        assertEquals(422, segundaTentativa.getStatusCode().value());
        assertEquals(1, usuarioRepository.findByEmail(email).stream().count());
    }

    @Test
    void login_comCredenciaisCorretas_devolveTokenValido() {
        final var email = "login-" + UUID.randomUUID() + "@tempoclaro.test";
        final var senha = "Senha@123";
        registrarEVerificar(email, senha, "Login Teste");

        final var resposta = post("/api/auth/login",
                LoginRequestDTO.builder().email(email).password(senha).build(), AuthResponseDTO.class);

        assertEquals(HttpStatus.OK, resposta.getStatusCode());
        assertNotNull(resposta.getBody().token());
    }

    @Test
    void login_comSenhaErrada_retorna401() {
        final var email = "senhaerrada-" + UUID.randomUUID() + "@tempoclaro.test";
        registrarEVerificar(email, "Senha@123", "X");

        final var resposta = post("/api/auth/login",
                LoginRequestDTO.builder().email(email).password("SenhaErrada@1").build(), MessageResponseDTO.class);

        assertEquals(HttpStatus.UNAUTHORIZED, resposta.getStatusCode());
    }

    @Test
    void login_comEmailNaoVerificado_retorna403() {
        final var email = "naoverificado-" + UUID.randomUUID() + "@tempoclaro.test";
        final var senha = "Senha@123";
        post("/api/auth/register",
                RegisterRequestDTO.builder().nome("Y").email(email).password(senha).build(),
                MessageResponseDTO.class);

        final var resposta = post("/api/auth/login",
                LoginRequestDTO.builder().email(email).password(senha).build(), MessageResponseDTO.class);

        assertEquals(HttpStatus.FORBIDDEN, resposta.getStatusCode());
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
