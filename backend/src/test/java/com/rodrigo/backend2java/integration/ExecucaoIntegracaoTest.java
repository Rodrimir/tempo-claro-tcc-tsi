package com.rodrigo.backend2java.integration;

import java.time.LocalTime;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;

import com.rodrigo.backend2java.BaseAPIIntegracaoTest;
import com.rodrigo.backend2java.execucao.ExecutionRequestDTO;
import com.rodrigo.backend2java.habito.HabitoRequestDTO;
import com.rodrigo.backend2java.execucao.ExecutionResponseDTO;
import com.rodrigo.backend2java.habito.HabitoResponseDTO;
import com.rodrigo.backend2java.infra.exception.MessageResponseDTO;
import com.rodrigo.backend2java.execucao.HistoricoExecucaoRepository;
import com.rodrigo.backend2java.execucao.StatusHabitoRepository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * A execução durante o dia (v3.0): acumula o realizado e não credita moeda nenhuma.
 * O crédito é do dia inteiro e acontece no fechamento — ver
 * {@link FechamentoDiarioIntegracaoTest}.
 */
class ExecucaoIntegracaoTest extends BaseAPIIntegracaoTest {

    @Autowired
    private StatusHabitoRepository statusHabitoRepository;

    @Autowired
    private HistoricoExecucaoRepository historicoExecucaoRepository;

    private UUID criarHabito(final int metaBase) {
        final var request = HabitoRequestDTO.builder()
                .titulo("Hábito de execução")
                .categoria("AGUA")
                .meta_base(metaBase)
                .tipo_medida("QUANTIDADE")
                .meta_frequencia_diaria(1)
                .horario_agendado(LocalTime.of(8, 0))
                .build();
        return post("/api/habits", request, HabitoResponseDTO.class).getBody().id();
    }

    @Test
    void execucaoAcumulaORealizadoSemCreditarMoedas() {
        final var habitoId = criarHabito(2000);
        final var token = UUID.randomUUID();

        final var resposta = post("/api/habits/" + habitoId + "/executions",
                new ExecutionRequestDTO(token, "COMPLETE_PADRAO", 2000), ExecutionResponseDTO.class);

        assertEquals(HttpStatus.OK, resposta.getStatusCode());
        // Previsão do que o dia renderá, não crédito.
        assertEquals(100, resposta.getBody().moedas_previstas_hoje());
        assertEquals(2000, resposta.getBody().valor_acumulado_hoje());
        assertFalse(resposta.getBody().bonus());

        final var status = statusHabitoRepository.findById(habitoId).orElseThrow();
        assertEquals(0, status.getMoedasLocais(), "nenhuma moeda é creditada na execução");
        assertEquals(2000, status.getValorAcumuladoHoje());
        assertEquals(1, status.getExecucoesHoje());
        assertEquals(0, status.getDiasSeguidos(), "a ofensiva só se move no fechamento do dia");
        assertTrue(historicoExecucaoRepository.existsByExecutionToken(token));
    }

    @Test
    void execucaoAcimaDe120PorCentoDaMeta_preve150ESinalizaBonus() {
        final var habitoId = criarHabito(2000);

        final var resposta = post("/api/habits/" + habitoId + "/executions",
                new ExecutionRequestDTO(UUID.randomUUID(), null, 2500), ExecutionResponseDTO.class);

        assertEquals(150, resposta.getBody().moedas_previstas_hoje());
        assertTrue(resposta.getBody().bonus());
        assertEquals(0, statusHabitoRepository.findById(habitoId).orElseThrow().getMoedasLocais());
    }

    @Test
    void diaParcial_preveCreditoProporcional() {
        final var habitoId = criarHabito(2000);

        // 60% da meta: "fez menos, ganha menos" — 60 moedas, não zero nem 100.
        final var resposta = post("/api/habits/" + habitoId + "/executions",
                new ExecutionRequestDTO(UUID.randomUUID(), null, 1200), ExecutionResponseDTO.class);

        assertEquals(60, resposta.getBody().moedas_previstas_hoje());
    }

    @Test
    void execucaoComMesmoToken_retorna422EMantemUmaUnicaLinhaNoHistorico() {
        final var habitoId = criarHabito(2000);
        final var token = UUID.randomUUID();
        post("/api/habits/" + habitoId + "/executions",
                new ExecutionRequestDTO(token, "COMPLETE_PADRAO", 2000), ExecutionResponseDTO.class);

        final var repeticao = post("/api/habits/" + habitoId + "/executions",
                new ExecutionRequestDTO(token, "COMPLETE_PADRAO", 2000), MessageResponseDTO.class);

        // §5.1: violação de regra de negócio é 422, não 400 (RF21/RNF09).
        assertEquals(422, repeticao.getStatusCode().value());
        assertEquals(2000, statusHabitoRepository.findById(habitoId).orElseThrow().getValorAcumuladoHoje());
    }

    @Test
    void desistenciaComFailTimeout_registraSemAcumularRealizado() {
        final var habitoId = criarHabito(2000);

        final var resposta = post("/api/habits/" + habitoId + "/executions",
                new ExecutionRequestDTO(UUID.randomUUID(), "FAIL_TIMEOUT", 700), ExecutionResponseDTO.class);

        assertEquals(HttpStatus.OK, resposta.getStatusCode());
        final var status = statusHabitoRepository.findById(habitoId).orElseThrow();
        // O valor parcial fica no histórico (RF10), mas não conta como realizado —
        // e a ofensiva só é decidida no fechamento, não aqui.
        assertEquals(0, status.getValorAcumuladoHoje());
        assertEquals(0, status.getExecucoesHoje());
    }

    @Test
    void desistenciaComFailBloqueio_semEscudoDisponivel_retorna422() {
        final var habitoId = criarHabito(2000);

        final var resposta = post("/api/habits/" + habitoId + "/executions",
                new ExecutionRequestDTO(UUID.randomUUID(), "FAIL_BLOQUEIO", 0), MessageResponseDTO.class);

        assertEquals(422, resposta.getStatusCode().value());
    }

    @Test
    void desistenciaComFailBloqueio_comEscudoDisponivel_consomeEMarcaODiaComoProtegido() {
        final var habitoId = criarHabito(2000);
        final var status = statusHabitoRepository.findById(habitoId).orElseThrow();
        status.setBloqueiosAcumulados(1);
        statusHabitoRepository.save(status);

        final var resposta = post("/api/habits/" + habitoId + "/executions",
                new ExecutionRequestDTO(UUID.randomUUID(), "FAIL_BLOQUEIO", 0), ExecutionResponseDTO.class);

        assertEquals(HttpStatus.OK, resposta.getStatusCode());
        final var statusDepois = statusHabitoRepository.findById(habitoId).orElseThrow();
        assertEquals(0, statusDepois.getBloqueiosAcumulados());
        assertTrue(statusDepois.getBloqueioUsadoHoje());
    }

    @Test
    void tipoDeExecucaoDesconhecido_retorna400() {
        final var habitoId = criarHabito(2000);

        final var resposta = post("/api/habits/" + habitoId + "/executions",
                new ExecutionRequestDTO(UUID.randomUUID(), "INVENTADO", 0), MessageResponseDTO.class);

        // Era 401 ("não autenticado") por causa do handler de IllegalArgumentException.
        assertEquals(HttpStatus.BAD_REQUEST, resposta.getStatusCode());
    }
}
