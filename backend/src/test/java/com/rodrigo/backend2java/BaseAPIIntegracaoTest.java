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

import com.rodrigo.backend2java.autenticacao.model.RegisterRequestDTO;
import com.rodrigo.backend2java.autenticacao.model.AuthResponseDTO;
import com.rodrigo.backend2java.autenticacao.model.VerifyEmailRequestDTO;
import com.rodrigo.backend2java.infra.exception.MessageResponseDTO;
import com.rodrigo.backend2java.usuario.model.UsuarioResponseDTO;
import com.rodrigo.backend2java.verificacao.FakeEmailService;
import com.rodrigo.backend2java.verificacao.model.TipoCodigo;

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
