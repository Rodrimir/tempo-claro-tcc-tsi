package com.rodrigo.backend2java.integration;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import com.rodrigo.backend2java.BaseAPIIntegracaoTest;
import com.rodrigo.backend2java.autenticacao.AuthResponseDTO;
import com.rodrigo.backend2java.autenticacao.ForgotPasswordRequestDTO;
import com.rodrigo.backend2java.autenticacao.LoginRequestDTO;
import com.rodrigo.backend2java.autenticacao.RegisterRequestDTO;
import com.rodrigo.backend2java.autenticacao.ResendCodeRequestDTO;
import com.rodrigo.backend2java.autenticacao.ResetPasswordRequestDTO;
import com.rodrigo.backend2java.autenticacao.VerifyEmailRequestDTO;
import com.rodrigo.backend2java.infra.exception.MessageResponseDTO;
import com.rodrigo.backend2java.usuario.UsuarioRepository;
import com.rodrigo.backend2java.verificacao.TipoCodigo;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * PLANO_REESTRUTURACAO.md, B / T.2.
 */
class RecuperacaoSenhaIntegracaoTest extends BaseAPIIntegracaoTest {

    @Autowired
    private UsuarioRepository usuarioRepository;

    private static final String SENHA_ORIGINAL = "Senha@123";

    private String registrarEVerificar() {
        final var email = "recupera-" + UUID.randomUUID() + "@tempoclaro.test";
        post("/api/auth/register",
                RegisterRequestDTO.builder().nome("Recupera Teste").email(email).password(SENHA_ORIGINAL).build(),
                MessageResponseDTO.class);
        final var codigo = fakeEmailService.ultimoCodigo(email, TipoCodigo.VERIFICACAO_EMAIL);
        post("/api/auth/verify-email", VerifyEmailRequestDTO.builder().email(email).codigo(codigo).build(),
                AuthResponseDTO.class);
        return email;
    }

    @Test
    void esqueciSenha_paraEmailExistente_enviaCodigoEDevolve200() {
        final var email = registrarEVerificar();

        final var resposta = post("/api/auth/forgot-password", ForgotPasswordRequestDTO.builder().email(email).build(),
                MessageResponseDTO.class);

        assertEquals(200, resposta.getStatusCode().value());
        assertTrue(resposta.getBody().success());
        assertNotNull(fakeEmailService.ultimoCodigo(email, TipoCodigo.RECUPERACAO_SENHA));
    }

    // Anti-enumeração: e-mail que não existe não pode ser diferenciável de um
    // que existe pela resposta — ambos são 200 com a mesma mensagem, e nenhum
    // código é gerado por baixo para quem não tem conta.
    @Test
    void esqueciSenha_paraEmailInexistente_tambemDevolve200SemGerarCodigo() {
        final var emailInexistente = "inexistente-" + UUID.randomUUID() + "@tempoclaro.test";

        final var resposta = post("/api/auth/forgot-password",
                ForgotPasswordRequestDTO.builder().email(emailInexistente).build(), MessageResponseDTO.class);

        assertEquals(200, resposta.getStatusCode().value());
        assertTrue(resposta.getBody().success());
        assertNull(fakeEmailService.ultimoCodigo(emailInexistente, TipoCodigo.RECUPERACAO_SENHA));
    }

    // O throttle de 60s (CodigoVerificacaoService.gerarCodigo) não pode vazar
    // como 422 aqui: AuthService.esqueciSenha o engole de propósito, senão uma
    // segunda chamada rápida no MESMO e-mail devolveria uma resposta diferente
    // da primeira — e essa diferença é exatamente o que a anti-enumeração
    // proíbe.
    @Test
    void esqueciSenha_chamadoDuasVezesRapido_continuaDevolvendo200() {
        final var email = registrarEVerificar();

        post("/api/auth/forgot-password", ForgotPasswordRequestDTO.builder().email(email).build(), MessageResponseDTO.class);
        final var segunda = post("/api/auth/forgot-password", ForgotPasswordRequestDTO.builder().email(email).build(),
                MessageResponseDTO.class);

        assertEquals(200, segunda.getStatusCode().value());
        assertTrue(segunda.getBody().success());
    }

    // resend-code (verificação de e-mail, não recuperação de senha) não tem o
    // mesmo motivo de anti-enumeração — aqui o throttle deve aparecer como 422
    // de verdade, para o app mostrar "aguarde um pouco" em vez de reenviar
    // e-mail em rajada.
    @Test
    void reenviarCodigoDeVerificacao_chamadoDuasVezesRapido_segundaVezRetorna422() {
        final var email = "throttle-" + UUID.randomUUID() + "@tempoclaro.test";
        post("/api/auth/register",
                RegisterRequestDTO.builder().nome("Throttle Teste").email(email).password(SENHA_ORIGINAL).build(),
                MessageResponseDTO.class);

        final var resposta = post("/api/auth/resend-code", ResendCodeRequestDTO.builder().email(email).build(),
                MessageResponseDTO.class);

        assertEquals(422, resposta.getStatusCode().value());
    }

    @Test
    void redefinirSenha_comCodigoCerto_trocaSenhaEDevolveToken() {
        final var email = registrarEVerificar();
        post("/api/auth/forgot-password", ForgotPasswordRequestDTO.builder().email(email).build(), MessageResponseDTO.class);
        final var codigo = fakeEmailService.ultimoCodigo(email, TipoCodigo.RECUPERACAO_SENHA);
        final var novaSenha = "SenhaNova@456";

        final var resposta = post("/api/auth/reset-password",
                ResetPasswordRequestDTO.builder().email(email).codigo(codigo).nova_senha(novaSenha).build(),
                AuthResponseDTO.class);
        assertEquals(200, resposta.getStatusCode().value());
        assertNotNull(resposta.getBody().token());

        final var loginComSenhaAntiga = post("/api/auth/login",
                LoginRequestDTO.builder().email(email).password(SENHA_ORIGINAL).build(), MessageResponseDTO.class);
        assertEquals(401, loginComSenhaAntiga.getStatusCode().value());

        final var loginComSenhaNova = post("/api/auth/login",
                LoginRequestDTO.builder().email(email).password(novaSenha).build(), AuthResponseDTO.class);
        assertEquals(200, loginComSenhaNova.getStatusCode().value());
        assertNotNull(loginComSenhaNova.getBody().token());
    }

    @Test
    void redefinirSenha_comCodigoErrado_retorna422() {
        final var email = registrarEVerificar();
        post("/api/auth/forgot-password", ForgotPasswordRequestDTO.builder().email(email).build(), MessageResponseDTO.class);

        final var resposta = post("/api/auth/reset-password",
                ResetPasswordRequestDTO.builder().email(email).codigo("000000").nova_senha("SenhaNova@456").build(),
                MessageResponseDTO.class);

        assertEquals(422, resposta.getStatusCode().value());
    }

    @Test
    void redefinirSenha_comSenhaFraca_retorna400() {
        final var email = registrarEVerificar();
        post("/api/auth/forgot-password", ForgotPasswordRequestDTO.builder().email(email).build(), MessageResponseDTO.class);
        final var codigo = fakeEmailService.ultimoCodigo(email, TipoCodigo.RECUPERACAO_SENHA);

        final var resposta = post("/api/auth/reset-password",
                ResetPasswordRequestDTO.builder().email(email).codigo(codigo).nova_senha("fraca123").build(),
                MessageResponseDTO.class);

        assertEquals(400, resposta.getStatusCode().value());
    }

    // Guarda a ordem de validação em AuthService.redefinirSenha: a senha fraca
    // precisa ser rejeitada ANTES de consumir o código, senão este teste
    // falharia na segunda chamada com "código incorreto" (já teria sido
    // marcado como usado pela tentativa anterior).
    @Test
    void redefinirSenha_comSenhaFraca_naoConsomeOCodigo() {
        final var email = registrarEVerificar();
        post("/api/auth/forgot-password", ForgotPasswordRequestDTO.builder().email(email).build(), MessageResponseDTO.class);
        final var codigo = fakeEmailService.ultimoCodigo(email, TipoCodigo.RECUPERACAO_SENHA);
        final var novaSenha = "SenhaNova@456";

        post("/api/auth/reset-password",
                ResetPasswordRequestDTO.builder().email(email).codigo(codigo).nova_senha("fraca123").build(),
                MessageResponseDTO.class);

        final var segundaTentativa = post("/api/auth/reset-password",
                ResetPasswordRequestDTO.builder().email(email).codigo(codigo).nova_senha(novaSenha).build(),
                AuthResponseDTO.class);

        assertEquals(200, segundaTentativa.getStatusCode().value());
        assertNotNull(segundaTentativa.getBody().token());
    }

    // Uma conta que nunca terminou de verificar o e-mail, mas recupera a senha
    // com sucesso, provou posse da caixa de entrada do mesmo jeito que
    // verify-email provaria — AuthService.redefinirSenha marca
    // usu_email_verificado = true por isso. Sem essa marca, o token que
    // reset-password devolve funcionaria uma vez (JWT não confere isEnabled()
    // de novo), mas um login normal em seguida cairia de volta no 403.
    @Test
    void redefinirSenha_emContaNuncaVerificada_marcaEmailComoVerificado() {
        final var email = "recupera-nao-verificada-" + UUID.randomUUID() + "@tempoclaro.test";
        post("/api/auth/register",
                RegisterRequestDTO.builder().nome("Nunca Verificou").email(email).password(SENHA_ORIGINAL).build(),
                MessageResponseDTO.class);

        post("/api/auth/forgot-password", ForgotPasswordRequestDTO.builder().email(email).build(), MessageResponseDTO.class);
        final var codigo = fakeEmailService.ultimoCodigo(email, TipoCodigo.RECUPERACAO_SENHA);
        final var novaSenha = "SenhaNova@456";

        post("/api/auth/reset-password",
                ResetPasswordRequestDTO.builder().email(email).codigo(codigo).nova_senha(novaSenha).build(),
                AuthResponseDTO.class);

        assertTrue(usuarioRepository.findByEmail(email).orElseThrow().isEmailVerificado());

        final var login = post("/api/auth/login",
                LoginRequestDTO.builder().email(email).password(novaSenha).build(), AuthResponseDTO.class);
        assertEquals(200, login.getStatusCode().value());
        assertNotNull(login.getBody().token());
    }
}
