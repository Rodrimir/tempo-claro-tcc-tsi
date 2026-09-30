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

    private UUID criarHabito(final int metaBase, final int vezesAoDia) {
        final var ocorrencias = new java.util.ArrayList<HabitoRequestDTO.OcorrenciaRequestDTO>();
        for (var i = 0; i < vezesAoDia; i++) {
            ocorrencias.add(new HabitoRequestDTO.OcorrenciaRequestDTO(LocalTime.of(8 + i, 0), null));
        }
        final var request = HabitoRequestDTO.builder()
                .titulo("Hábito de execução")
                .categoria("AGUA")
                .meta_base(metaBase)
                .tipo_medida("QUANTIDADE")
                .meta_frequencia_diaria(vezesAoDia)
                .horario_agendado(LocalTime.of(8, 0))
                .ocorrencias(ocorrencias)
                .build();
        return post("/api/habits", request, HabitoResponseDTO.class).getBody().id();
    }

    @Test
    void execucaoQueBateAMeta_credita100NaHora() {
        final var habitoId = criarHabito(2000);
        final var token = UUID.randomUUID();

        final var resposta = post("/api/habits/" + habitoId + "/executions",
                new ExecutionRequestDTO(token, "COMPLETE_PADRAO", 2000), ExecutionResponseDTO.class);

        assertEquals(HttpStatus.OK, resposta.getStatusCode());
        assertEquals(100, resposta.getBody().moedas_ganhas_agora());
        assertEquals(2000, resposta.getBody().valor_acumulado_hoje());
        assertFalse(resposta.getBody().bonus());

        final var status = statusHabitoRepository.findById(habitoId).orElseThrow();
        assertEquals(100, status.getMoedasLocais(), "creditado na hora, não no fechamento");
        assertEquals(100, status.getMoedasCreditadasHoje());
        assertEquals(2000, status.getValorAcumuladoHoje());
        assertEquals(1, status.getExecucoesHoje());
        assertEquals(0, status.getDiasSeguidos(), "a ofensiva só se move no fechamento do dia");
        assertTrue(historicoExecucaoRepository.existsByExecutionToken(token));
    }

    @Test
    void execucaoAcimaDe120PorCentoDaMeta_credita150ESinalizaBonus() {
        final var habitoId = criarHabito(2000);

        final var resposta = post("/api/habits/" + habitoId + "/executions",
                new ExecutionRequestDTO(UUID.randomUUID(), null, 2500), ExecutionResponseDTO.class);

        assertEquals(150, resposta.getBody().moedas_ganhas_agora());
        assertTrue(resposta.getBody().bonus());
        assertEquals(150, statusHabitoRepository.findById(habitoId).orElseThrow().getMoedasLocais());
    }

    @Test
    void execucaoAcimaDe150PorCentoDaMeta_credita200() {
        final var habitoId = criarHabito(2000);

        final var resposta = post("/api/habits/" + habitoId + "/executions",
                new ExecutionRequestDTO(UUID.randomUUID(), null, 3000), ExecutionResponseDTO.class);

        assertEquals(200, resposta.getBody().moedas_ganhas_agora());
        assertEquals(200, statusHabitoRepository.findById(habitoId).orElseThrow().getMoedasLocais());
    }

    @Test
    void diaAbaixoDaMeta_naoCreditaNada() {
        final var habitoId = criarHabito(2000);

        final var resposta = post("/api/habits/" + habitoId + "/executions",
                new ExecutionRequestDTO(UUID.randomUUID(), null, 1200), ExecutionResponseDTO.class);

        assertEquals(0, resposta.getBody().moedas_ganhas_agora());
        assertEquals(0, statusHabitoRepository.findById(habitoId).orElseThrow().getMoedasLocais());
    }

    @Test
    void execucoesSucessivasNoMesmoDia_creditamSoADiferencaDeCadaPatamar() {
        final var habitoId = criarHabito(1000);

        final var primeira = post("/api/habits/" + habitoId + "/executions",
                new ExecutionRequestDTO(UUID.randomUUID(), null, 1000), ExecutionResponseDTO.class);
        assertEquals(100, primeira.getBody().moedas_ganhas_agora(), "cruzou 100% agora");

        final var segunda = post("/api/habits/" + habitoId + "/executions",
                new ExecutionRequestDTO(UUID.randomUUID(), null, 200), ExecutionResponseDTO.class);
        assertEquals(50, segunda.getBody().moedas_ganhas_agora(), "total foi a 1200 (120%): só a diferença até 150");

        final var terceira = post("/api/habits/" + habitoId + "/executions",
                new ExecutionRequestDTO(UUID.randomUUID(), null, 300), ExecutionResponseDTO.class);
        assertEquals(50, terceira.getBody().moedas_ganhas_agora(), "total foi a 1500 (150%): só a diferença até 200");

        final var status = statusHabitoRepository.findById(habitoId).orElseThrow();
        assertEquals(200, status.getMoedasLocais());
        assertEquals(200, status.getMoedasCreditadasHoje());
    }

    @Test
    void duasExecucoesQueSomamAMeta_creditamCemNoTotal() {
        final var habitoId = criarHabito(1000);

        final var primeira = post("/api/habits/" + habitoId + "/executions",
                new ExecutionRequestDTO(UUID.randomUUID(), null, 500), ExecutionResponseDTO.class);
        assertEquals(0, primeira.getBody().moedas_ganhas_agora(), "50% ainda não deve nada");

        final var segunda = post("/api/habits/" + habitoId + "/executions",
                new ExecutionRequestDTO(UUID.randomUUID(), null, 500), ExecutionResponseDTO.class);
        assertEquals(100, segunda.getBody().moedas_ganhas_agora(), "completou os 100% agora");

        assertEquals(100, statusHabitoRepository.findById(habitoId).orElseThrow().getMoedasLocais());
    }

    @Test
    void habitoTresVezesAoDia_creditaNoMaximoDuzentosNoDia() {
        final var habitoId = criarHabito(300, 3);

        post("/api/habits/" + habitoId + "/executions",
                new ExecutionRequestDTO(UUID.randomUUID(), "COMPLETE_PADRAO", 150), ExecutionResponseDTO.class);
        post("/api/habits/" + habitoId + "/executions",
                new ExecutionRequestDTO(UUID.randomUUID(), "COMPLETE_PADRAO", 150), ExecutionResponseDTO.class);
        final var terceira = post("/api/habits/" + habitoId + "/executions",
                new ExecutionRequestDTO(UUID.randomUUID(), "COMPLETE_PADRAO", 150), ExecutionResponseDTO.class);

        assertEquals(200, terceira.getBody().moedas_totais());
        assertEquals(200, statusHabitoRepository.findById(habitoId).orElseThrow().getMoedasLocais());
    }

    @Test
    void execucaoComMesmoToken_retorna422EMantemUmaUnicaLinhaNoHistorico() {
        final var habitoId = criarHabito(2000);
        final var token = UUID.randomUUID();
        post("/api/habits/" + habitoId + "/executions",
                new ExecutionRequestDTO(token, "COMPLETE_PADRAO", 2000), ExecutionResponseDTO.class);

        final var repeticao = post("/api/habits/" + habitoId + "/executions",
                new ExecutionRequestDTO(token, "COMPLETE_PADRAO", 2000), MessageResponseDTO.class);

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
        assertEquals(0, status.getValorAcumuladoHoje());
        assertEquals(0, status.getExecucoesHoje());
        assertEquals(0, resposta.getBody().moedas_ganhas_agora(), "desistência não credita");
    }

    @Test
    void desistenciaComFailBloqueio_semEscudoDisponivel_retorna422() {
        final var habitoId = criarHabito(2000);
        final var status = statusHabitoRepository.findById(habitoId).orElseThrow();
        status.setBloqueiosAcumulados(0);
        statusHabitoRepository.save(status);

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

        assertEquals(HttpStatus.BAD_REQUEST, resposta.getStatusCode());
    }
}
