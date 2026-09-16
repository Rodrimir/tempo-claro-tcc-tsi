package com.rodrigo.backend2java.integration;

import java.time.OffsetDateTime;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import com.rodrigo.backend2java.BaseAPIIntegracaoTest;
import com.rodrigo.backend2java.autenticacao.AuthResponseDTO;
import com.rodrigo.backend2java.autenticacao.RegisterRequestDTO;
import com.rodrigo.backend2java.autenticacao.ResendCodeRequestDTO;
import com.rodrigo.backend2java.autenticacao.VerifyEmailRequestDTO;
import com.rodrigo.backend2java.infra.exception.MessageResponseDTO;
import com.rodrigo.backend2java.verificacao.CodigoVerificacaoRepository;
import com.rodrigo.backend2java.verificacao.TipoCodigo;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

/**
 * PLANO_REESTRUTURACAO.md, C / T.2 — cobre os casos que
 * BaseAPIIntegracaoTest.autenticarUsuarioDeTeste não exercita porque ali o
 * caminho é sempre o feliz (código certo, na hora certa, uma vez só).
 */
class VerificacaoEmailIntegracaoTest extends BaseAPIIntegracaoTest {

    @Autowired
    private CodigoVerificacaoRepository codigoVerificacaoRepository;

    private String registrar() {
        final var email = "verifica-" + UUID.randomUUID() + "@tempoclaro.test";
        post("/api/auth/register",
                RegisterRequestDTO.builder().nome("Verifica Teste").email(email).password("Senha@123").build(),
                MessageResponseDTO.class);
        return email;
    }

    // CodigoVerificacaoService.gerarCodigo recusa reenvio antes de 60s
    // (PLANO_REESTRUTURACAO.md, B.2). Testes que chamam resend-code logo
    // depois de registrar() precisam simular esse tempo já ter passado, sem
    // de fato esperar 60s de verdade a cada execução da suíte.
    private void tornarReenvioLiberado(final String email, final TipoCodigo tipo) {
        final var ultimo = codigoVerificacaoRepository.findFirstByEmailAndTipoOrderByCriadoEmDesc(email, tipo.name())
                .orElseThrow();
        ultimo.setCriadoEm(OffsetDateTime.now().minusSeconds(61));
        codigoVerificacaoRepository.save(ultimo);
    }

    @Test
    void codigoErrado_retorna422() {
        final var email = registrar();

        final var resposta = post("/api/auth/verify-email",
                VerifyEmailRequestDTO.builder().email(email).codigo("000000").build(), MessageResponseDTO.class);

        assertEquals(422, resposta.getStatusCode().value());
    }

    @Test
    void codigoExpirado_retorna422() {
        final var email = registrar();
        final var codigo = fakeEmailService.ultimoCodigo(email, TipoCodigo.VERIFICACAO_EMAIL);

        final var pendente = codigoVerificacaoRepository
                .findFirstByEmailAndTipoAndUsadoEmIsNullOrderByCriadoEmDesc(email, TipoCodigo.VERIFICACAO_EMAIL.name())
                .orElseThrow();
        pendente.setExpiraEm(OffsetDateTime.now().minusMinutes(1));
        codigoVerificacaoRepository.save(pendente);

        final var resposta = post("/api/auth/verify-email",
                VerifyEmailRequestDTO.builder().email(email).codigo(codigo).build(), MessageResponseDTO.class);

        assertEquals(422, resposta.getStatusCode().value());
    }

    @Test
    void cincoTentativasErradas_bloqueiaAteCodigoNovo() {
        final var email = registrar();

        for (int i = 0; i < 5; i++) {
            post("/api/auth/verify-email",
                    VerifyEmailRequestDTO.builder().email(email).codigo("000000").build(), MessageResponseDTO.class);
        }

        final var codigoCerto = fakeEmailService.ultimoCodigo(email, TipoCodigo.VERIFICACAO_EMAIL);
        final var comCodigoCerto = post("/api/auth/verify-email",
                VerifyEmailRequestDTO.builder().email(email).codigo(codigoCerto).build(), MessageResponseDTO.class);
        assertEquals(422, comCodigoCerto.getStatusCode().value());

        tornarReenvioLiberado(email, TipoCodigo.VERIFICACAO_EMAIL);
        post("/api/auth/resend-code", ResendCodeRequestDTO.builder().email(email).build(), MessageResponseDTO.class);
        final var codigoNovo = fakeEmailService.ultimoCodigo(email, TipoCodigo.VERIFICACAO_EMAIL);
        assertNotEquals(codigoCerto, codigoNovo);

        final var comCodigoNovo = post("/api/auth/verify-email",
                VerifyEmailRequestDTO.builder().email(email).codigo(codigoNovo).build(), AuthResponseDTO.class);
        assertEquals(200, comCodigoNovo.getStatusCode().value());
        assertNotNull(comCodigoNovo.getBody().token());
    }

    @Test
    void reenviar_invalidaCodigoAnterior() {
        final var email = registrar();
        final var codigoAntigo = fakeEmailService.ultimoCodigo(email, TipoCodigo.VERIFICACAO_EMAIL);

        tornarReenvioLiberado(email, TipoCodigo.VERIFICACAO_EMAIL);
        post("/api/auth/resend-code", ResendCodeRequestDTO.builder().email(email).build(), MessageResponseDTO.class);

        final var comCodigoAntigo = post("/api/auth/verify-email",
                VerifyEmailRequestDTO.builder().email(email).codigo(codigoAntigo).build(), MessageResponseDTO.class);
        assertEquals(422, comCodigoAntigo.getStatusCode().value());
    }

    @Test
    void reenviar_paraEmailJaVerificado_retorna422() {
        final var email = registrar();
        final var codigo = fakeEmailService.ultimoCodigo(email, TipoCodigo.VERIFICACAO_EMAIL);
        post("/api/auth/verify-email", VerifyEmailRequestDTO.builder().email(email).codigo(codigo).build(),
                AuthResponseDTO.class);

        final var resposta = post("/api/auth/resend-code", ResendCodeRequestDTO.builder().email(email).build(),
                MessageResponseDTO.class);

        assertEquals(422, resposta.getStatusCode().value());
    }
}
