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
import com.rodrigo.backend2java.usuario.UsuarioResponseDTO;

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

        final var respostaRegistro = rest.postForEntity("/api/auth/register", registro, AuthResponseDTO.class);
        assertNotNull(respostaRegistro.getBody());
        jwtToken = respostaRegistro.getBody().token();
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
