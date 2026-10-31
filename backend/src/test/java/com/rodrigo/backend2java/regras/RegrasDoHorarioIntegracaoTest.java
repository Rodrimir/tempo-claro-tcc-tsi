package com.rodrigo.backend2java.regras;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;

import com.rodrigo.backend2java.BaseAPIIntegracaoTest;
import com.rodrigo.backend2java.execucao.HistoricoExecucaoRepository;
import com.rodrigo.backend2java.execucao.StatusHabitoRepository;
import com.rodrigo.backend2java.execucao.model.ExecutionRequestDTO;
import com.rodrigo.backend2java.execucao.model.ExecutionResponseDTO;
import com.rodrigo.backend2java.habito.HabitoRepository;
import com.rodrigo.backend2java.habito.model.DashboardResponseDTO;
import com.rodrigo.backend2java.habito.model.HabitoRequestDTO;
import com.rodrigo.backend2java.habito.model.HabitoRequestDTO.OcorrenciaRequestDTO;
import com.rodrigo.backend2java.habito.model.HabitoResponseDTO;
import com.rodrigo.backend2java.infra.exception.MessageResponseDTO;
import com.rodrigo.backend2java.stats.model.StatsResponseDTO;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Regras que dependem da hora do dia, pedidas em 16/10/2026: o dia retroativo na criação (horário
 * já passado fica concluído, sem recompensa) e a liberação da tarefa 15 minutos antes do horário,
 * agora conferida também no servidor. O relógio é fixo para que o resultado não dependa da hora em
 * que a suíte roda.
 */
@Import(RelogioDeTeste.Config.class)
@TestPropertySource(properties = "app.regras.horario-do-dia=true")
class RegrasDoHorarioIntegracaoTest extends BaseAPIIntegracaoTest {

    private static final ZoneId SP = ZoneId.of("America/Sao_Paulo");

    @Autowired
    private RelogioDeTeste relogio;

    @Autowired
    private StatusHabitoRepository statusHabitoRepository;

    @Autowired
    private HabitoRepository habitoRepository;

    @Autowired
    private HistoricoExecucaoRepository historicoExecucaoRepository;

    @AfterEach
    void voltarAoRelogioReal() {
        relogio.voltarAoRelogioReal();
    }

    private HabitoRequestDTO.HabitoRequestDTOBuilder estudo(final int meta) {
        return HabitoRequestDTO.builder()
                .titulo("Estudo")
                .categoria("ESTUDO")
                .tipo_medida("TEMPO")
                .meta_base(meta)
                .meta_frequencia_diaria(1)
                .frequencia_semanal("1111111");
    }

    private HabitoResponseDTO criar(final HabitoRequestDTO request) {
        final var resposta = post("/api/habits", request, HabitoResponseDTO.class);
        assertEquals(201, resposta.getStatusCode().value(), String.valueOf(resposta.getBody()));
        return resposta.getBody();
    }

    private HabitoResponseDTO noPainel(final UUID habitoId) {
        return get("/api/dashboard", DashboardResponseDTO.class).getBody().habits().stream()
                .filter(h -> h.id().equals(habitoId)).findFirst().orElseThrow();
    }

    private ExecutionRequestDTO conclusao(final int valor) {
        return ExecutionRequestDTO.builder().execution_token(UUID.randomUUID()).valor_realizado(valor).build();
    }

    @Test
    void criarDepoisDoHorario_diaFicaConcluidoSemMoedaSemOfensiva() {
        relogio.fixarHoje(SP, LocalTime.of(15, 0));

        final var criado = criar(estudo(10).horario_agendado(LocalTime.of(8, 0)).build());

        assertEquals("COMPLETED", criado.status());
        assertTrue(criado.ocorrencias().get(0).dispensada());
        assertEquals("FEITO", criado.ocorrencias().get(0).status());
        final var painel = noPainel(criado.id());
        assertEquals("COMPLETED", painel.status());
        assertEquals(0, painel.moedas_locais());
        assertEquals(0, painel.dias_seguidos());
        assertEquals(10, statusHabitoRepository.findById(criado.id()).orElseThrow().getAlvoDispensadoHoje());
    }

    @Test
    void ocorrenciaComFimAindaPorVir_naoEhDispensada() {
        relogio.fixarHoje(SP, LocalTime.of(10, 0));

        final var criado = criar(estudo(20).meta_frequencia_diaria(2).horario_agendado(null)
                .ocorrencias(List.of(new OcorrenciaRequestDTO(LocalTime.of(9, 0), LocalTime.of(11, 0)),
                        new OcorrenciaRequestDTO(LocalTime.of(18, 0), null)))
                .build());

        assertFalse(criado.ocorrencias().get(0).dispensada());
        assertEquals("PENDING", criado.status());
    }

    @Test
    void semHorario_usa2359_eNaoEhDispensada() {
        relogio.fixarHoje(SP, LocalTime.of(15, 0));

        final var criado = criar(estudo(10).horario_agendado(null).build());

        assertFalse(criado.ocorrencias().get(0).dispensada());
        assertEquals("PENDING", criado.status());
    }

    @Test
    void diaNaoProgramado_naoDispensaNada() {
        relogio.fixarHoje(SP, LocalTime.of(15, 0));
        final var indiceDeHoje = LocalDate.now(SP).getDayOfWeek().getValue() % 7;
        final var mascara = new StringBuilder("1111111");
        mascara.setCharAt(indiceDeHoje, '0');

        final var criado = criar(estudo(10).horario_agendado(LocalTime.of(8, 0))
                .frequencia_semanal(mascara.toString()).build());

        assertFalse(criado.ocorrencias().get(0).dispensada());
        assertEquals(0, statusHabitoRepository.findById(criado.id()).orElseThrow().getAlvoDispensadoHoje());
    }

    @Test
    void parteDispensada_eORestoFeito_rendeMoedasPelaMetaReduzida() {
        relogio.fixarHoje(SP, LocalTime.of(15, 0));
        final var criado = criar(estudo(20).meta_frequencia_diaria(2).horario_agendado(null)
                .ocorrencias(List.of(new OcorrenciaRequestDTO(LocalTime.of(8, 0), null),
                        new OcorrenciaRequestDTO(LocalTime.of(20, 0), null)))
                .build());
        assertEquals("PENDING", criado.status());

        relogio.fixarHoje(SP, LocalTime.of(19, 50));
        final var resposta = post("/api/habits/" + criado.id() + "/executions", conclusao(10),
                ExecutionResponseDTO.class);

        assertEquals(200, resposta.getStatusCode().value());
        assertEquals(100, resposta.getBody().moedas_ganhas_agora(), "10 de 10 restantes = 100%");
        assertEquals("COMPLETED", noPainel(criado.id()).status());
    }

    @Test
    void fechamentoDeDiaTodoDispensado_ehNeutro() {
        relogio.fixarHoje(SP, LocalTime.of(15, 0));
        final var criado = criar(estudo(10).horario_agendado(LocalTime.of(8, 0)).build());

        // Simula a virada: o dia da dispensa vira ontem, o hábito já existia há dias e a ofensiva
        // vinha em 5. Um dia neutro não soma, não quebra e não gasta escudo.
        final var habito = habitoRepository.findById(criado.id()).orElseThrow();
        habito.setCriadoEm(OffsetDateTime.now().minusDays(10));
        habitoRepository.save(habito);
        final var status = statusHabitoRepository.findById(criado.id()).orElseThrow();
        status.setUltimoReset(LocalDate.now(SP).minusDays(2));
        status.setDiasSeguidos(5);
        statusHabitoRepository.save(status);

        final var painel = noPainel(criado.id());

        assertEquals(5, painel.dias_seguidos());
        assertEquals(3, painel.bloqueios_acumulados());
        assertEquals(0, statusHabitoRepository.findById(criado.id()).orElseThrow().getAlvoDispensadoHoje());
    }

    @Test
    void diaDispensado_naoContaNaConstancia() {
        relogio.fixarHoje(SP, LocalTime.of(15, 0));
        final var criado = criar(estudo(10).horario_agendado(LocalTime.of(8, 0)).build());

        final var stats = get("/api/stats/monthly?habitoId=" + criado.id(), StatsResponseDTO.class).getBody();

        final var hoje = stats.dias().get(stats.dias().size() - 1);
        assertTrue(hoje.dispensado());
        assertEquals(0, stats.dias_cobrados());
        assertEquals(29, stats.dias().stream().filter(d -> Boolean.TRUE.equals(d.antes_da_criacao())).count());
    }

    @Test
    void concluirAntesDaLiberacao_recusaCom422() {
        relogio.fixarHoje(SP, LocalTime.of(6, 0));
        final var criado = criar(estudo(10).horario_agendado(LocalTime.of(8, 0)).build());

        relogio.fixarHoje(SP, LocalTime.of(7, 40));
        final var cedo = post("/api/habits/" + criado.id() + "/executions", conclusao(10), MessageResponseDTO.class);
        assertEquals(422, cedo.getStatusCode().value());
        assertTrue(cedo.getBody().message().contains("07:45"), cedo.getBody().message());

        relogio.fixarHoje(SP, LocalTime.of(7, 45));
        final var naHora = post("/api/habits/" + criado.id() + "/executions", conclusao(10),
                ExecutionResponseDTO.class);
        assertEquals(200, naHora.getStatusCode().value());
    }

    @Test
    void semOcorrenciaAtiva_execucaoExtraContinuaAceita() {
        relogio.fixarHoje(SP, LocalTime.of(15, 0));
        final var criado = criar(estudo(10).horario_agendado(LocalTime.of(8, 0)).build());

        final var resposta = post("/api/habits/" + criado.id() + "/executions", conclusao(10),
                ExecutionResponseDTO.class);

        assertEquals(200, resposta.getStatusCode().value());
        assertEquals(100, resposta.getBody().moedas_ganhas_agora(),
                "com tudo dispensado, o que for feito vale sobre a meta inteira");
        assertEquals(1, historicoExecucaoRepository.listarDiasComDispensa(criado.id(),
                LocalDate.now(SP), LocalDate.now(SP)).size());
    }
}
