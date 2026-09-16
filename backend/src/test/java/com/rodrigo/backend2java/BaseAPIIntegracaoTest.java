package com.rodrigo.backend2java;

import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.resttestclient.TestRestTemplate;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureTestRestTemplate;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;

import com.rodrigo.backend2java.autenticacao.RegisterRequestDTO;
import com.rodrigo.backend2java.autenticacao.AuthResponseDTO;
import com.rodrigo.backend2java.autenticacao.VerifyEmailRequestDTO;
import com.rodrigo.backend2java.infra.exception.MessageResponseDTO;
import com.rodrigo.backend2java.usuario.UsuarioResponseDTO;
import com.rodrigo.backend2java.verificacao.FakeEmailService;
import com.rodrigo.backend2java.verificacao.TipoCodigo;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.http.HttpMethod.DELETE;
import static org.springframework.http.HttpMethod.GET;
import static org.springframework.http.HttpMethod.POST;
import static org.springframework.http.HttpMethod.PUT;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureTestRestTemplate
@ActiveProfiles("test")
public abstract class BaseAPIIntegracaoTest {

    @Autowired
    protected TestRestTemplate rest;

    @Autowired
    protected FakeEmailService fakeEmailService;

    protected String jwtToken;
    protected String emailUsuarioTeste;
    protected UUID idUsuarioTeste;
    protected String senhaUsuarioTeste = "Senha@123";

    // PLANO_REESTRUTURACAO.md, C — desde que o cadastro passou a exigir
    // verificação de e-mail (@see AuthService.cadastrar), toda suíte precisa
    // andar o fluxo completo register -> pegar o código (via FakeEmailService,
    // nunca SMTP de verdade) -> verify-email para só então ter um token. Isto
    // faz cada teste da suíte também exercitar o fluxo real de verificação.
    @BeforeEach
    void autenticarUsuarioDeTeste() {
        emailUsuarioTeste = "teste-" + UUID.randomUUID() + "@tempoclaro.test";

        final var registro = RegisterRequestDTO.builder()
                .nome("Usuário de Teste")
                .email(emailUsuarioTeste)
                .password(senhaUsuarioTeste)
                .build();

        final var respostaRegistro = rest.postForEntity("/api/auth/register", registro, MessageResponseDTO.class);
        assertNotNull(respostaRegistro.getBody());

        final var codigo = fakeEmailService.ultimoCodigo(emailUsuarioTeste, TipoCodigo.VERIFICACAO_EMAIL);
        assertNotNull(codigo);

        final var verificacao = VerifyEmailRequestDTO.builder().email(emailUsuarioTeste).codigo(codigo).build();
        final var respostaVerificacao = rest.postForEntity("/api/auth/verify-email", verificacao, AuthResponseDTO.class);
        assertNotNull(respostaVerificacao.getBody());
        jwtToken = respostaVerificacao.getBody().token();
        assertNotNull(jwtToken);

        final var me = get("/api/me", UsuarioResponseDTO.class);
        idUsuarioTeste = me.getBody().id();
    }

    protected HttpHeaders getHeaders() {
        final var headers = new HttpHeaders();
        headers.add(HttpHeaders.AUTHORIZATION, "Bearer " + jwtToken);
        headers.add(HttpHeaders.CONTENT_TYPE, "application/json");
        return headers;
    }

    protected <T> ResponseEntity<T> post(final String url, final Object body, final Class<T> responseType) {
        return rest.exchange(url, POST, new HttpEntity<>(body, getHeaders()), responseType);
    }

    protected <T> ResponseEntity<T> put(final String url, final Object body, final Class<T> responseType) {
        return rest.exchange(url, PUT, new HttpEntity<>(body, getHeaders()), responseType);
    }

    protected <T> ResponseEntity<T> get(final String url, final Class<T> responseType) {
        return rest.exchange(url, GET, new HttpEntity<>(getHeaders()), responseType);
    }

    protected <T> ResponseEntity<T> delete(final String url, final Class<T> responseType) {
        return rest.exchange(url, DELETE, new HttpEntity<>(getHeaders()), responseType);
    }
}
