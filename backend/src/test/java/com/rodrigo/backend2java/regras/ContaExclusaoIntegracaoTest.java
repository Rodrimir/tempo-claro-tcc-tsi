package com.rodrigo.backend2java.regras;

import java.time.LocalTime;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;

import com.rodrigo.backend2java.BaseAPIIntegracaoTest;
import com.rodrigo.backend2java.autenticacao.model.RegisterRequestDTO;
import com.rodrigo.backend2java.execucao.StatusHabitoRepository;
import com.rodrigo.backend2java.habito.HabitoRepository;
import com.rodrigo.backend2java.habito.model.HabitoRequestDTO;
import com.rodrigo.backend2java.habito.model.HabitoResponseDTO;
import com.rodrigo.backend2java.infra.exception.MessageResponseDTO;
import com.rodrigo.backend2java.usuario.UsuarioRepository;
import com.rodrigo.backend2java.usuario.model.ExclusaoContaDTO;
import com.rodrigo.backend2java.verificacao.CodigoVerificacaoRepository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Exclusão de conta (pedido de 16/10/2026): só com a palavra exata, "excluir!" ou "delete!", e
 * apagando tudo o que depende da conta.
 */
class ContaExclusaoIntegracaoTest extends BaseAPIIntegracaoTest {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private HabitoRepository habitoRepository;

    @Autowired
    private StatusHabitoRepository statusHabitoRepository;

    @Autowired
    private CodigoVerificacaoRepository codigoVerificacaoRepository;

    private int excluir(final Object corpo) {
        return rest.exchange("/api/me", HttpMethod.DELETE, new HttpEntity<>(corpo, getHeaders()),
                MessageResponseDTO.class).getStatusCode().value();
    }

    @ParameterizedTest
    @ValueSource(strings = { "", "excluir", "EXCLUIR!", "Excluir!", "delete", "apagar!" })
    void palavraDiferente_recusaCom400_eNadaEApagado(final String palavra) {
        assertEquals(400, excluir(new ExclusaoContaDTO(palavra)));
        assertTrue(usuarioRepository.findById(idUsuarioTeste).isPresent());
    }

    @Test
    void semCorpo_recusaCom400() {
        assertEquals(400, excluir(null));
    }

    @ParameterizedTest
    @ValueSource(strings = { "excluir!", "delete!", "excluir! " })
    void palavraCerta_apagaAContaEOQueDependeDela(final String palavra) {
        final var habito = post("/api/habits", HabitoRequestDTO.builder()
                .titulo("Água").categoria("AGUA").tipo_medida("QUANTIDADE").meta_base(1000)
                .meta_frequencia_diaria(1).horario_agendado(LocalTime.of(23, 59)).build(),
                HabitoResponseDTO.class).getBody();

        assertEquals(200, excluir(Map.of("confirmacao", palavra)));

        assertTrue(usuarioRepository.findById(idUsuarioTeste).isEmpty());
        assertTrue(habitoRepository.findById(habito.id()).isEmpty());
        assertTrue(statusHabitoRepository.findById(habito.id()).isEmpty());
        assertTrue(codigoVerificacaoRepository
                .findFirstByEmailAndTipoOrderByCriadoEmDesc(emailUsuarioTeste, "VERIFICACAO_EMAIL").isEmpty());
    }

    @Test
    void depoisDeExcluir_oTokenAntigoDeixaDeValer() {
        assertEquals(200, excluir(new ExclusaoContaDTO("excluir!")));

        assertEquals(403, get("/api/dashboard", Object.class).getStatusCode().value());
    }

    @Test
    void depoisDeExcluir_oMesmoEmailPodeSerCadastradoDeNovo() {
        assertEquals(200, excluir(new ExclusaoContaDTO("excluir!")));

        final var resposta = rest.postForEntity("/api/auth/register", RegisterRequestDTO.builder()
                .nome("De volta").email(emailUsuarioTeste).password(senhaUsuarioTeste).build(),
                MessageResponseDTO.class);

        assertEquals(201, resposta.getStatusCode().value());
    }
}
