package com.rodrigo.backend2java.integration;

import java.util.List;
import java.util.UUID;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.OffsetDateTime;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CyclicBarrier;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import com.rodrigo.backend2java.BaseAPIIntegracaoTest;
import com.rodrigo.backend2java.calibracao.CalibracaoRepository;
import com.rodrigo.backend2java.calibracao.model.CalibracaoRequestDTO;
import com.rodrigo.backend2java.calibracao.model.CalibracaoRequestDTO.RespostaDTO;
import com.rodrigo.backend2java.calibracao.model.CalibracaoResponseDTO;
import com.rodrigo.backend2java.execucao.HistoricoExecucaoRepository;
import com.rodrigo.backend2java.execucao.StatusHabitoRepository;
import com.rodrigo.backend2java.execucao.model.ExecutionRequestDTO;
import com.rodrigo.backend2java.execucao.model.ExecutionResponseDTO;
import com.rodrigo.backend2java.execucao.model.HistoricoExecucao;
import com.rodrigo.backend2java.habito.FechamentoDiarioJob;
import com.rodrigo.backend2java.habito.HabitoRepository;
import com.rodrigo.backend2java.habito.model.HabitoRequestDTO;
import com.rodrigo.backend2java.habito.model.HabitoRequestDTO.OcorrenciaRequestDTO;
import com.rodrigo.backend2java.habito.model.HabitoResponseDTO;
import com.rodrigo.backend2java.infra.exception.MessageResponseDTO;
import com.rodrigo.backend2java.stats.model.StatsResponseDTO;
import com.rodrigo.backend2java.usuario.model.ProfileUpdateDTO;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Regressão das correções dos defeitos DEF-02 a DEF-16 e da apuração do dia sob demanda, que
 * protege os contadores diários quando a API acorda no plano gratuito do Render. Cada teste cita
 * o caso da planilha que antes era reprovado.
 */
class CorrecaoDefeitosIntegracaoTest extends BaseAPIIntegracaoTest {

    private static final ZoneId FUSO_PADRAO = ZoneId.of("America/Sao_Paulo");

    @Autowired
    private StatusHabitoRepository statusHabitoRepository;

    @Autowired
    private HistoricoExecucaoRepository historicoExecucaoRepository;

    @Autowired
    private HabitoRepository habitoRepository;

    @Autowired
    private CalibracaoRepository calibracaoRepository;

    @Autowired
    private FechamentoDiarioJob fechamentoDiarioJob;

    private LocalDate hoje() {
        return LocalDate.now(FUSO_PADRAO);
    }

    private HabitoRequestDTO.HabitoRequestDTOBuilder habito(final int metaBase) {
        return HabitoRequestDTO.builder()
                .titulo("Beber água")
                .categoria("AGUA")
                .tipo_medida("QUANTIDADE")
                .meta_base(metaBase)
                .meta_frequencia_diaria(1)
                .horario_agendado(LocalTime.of(23, 59))
                .frequencia_semanal("1111111");
    }

    private UUID criar(final HabitoRequestDTO request) {
        final var resposta = post("/api/habits", request, HabitoResponseDTO.class);
        assertEquals(201, resposta.getStatusCode().value());
        return resposta.getBody().id();
    }

    private void registrarNoHistorico(final UUID habitoId, final LocalDate dia, final int valor) {
        historicoExecucaoRepository.save(HistoricoExecucao.builder()
                .id(UUID.randomUUID())
                .habitoId(habitoId)
                .executionToken(UUID.randomUUID())
                .dataHoraExecucao(OffsetDateTime.now())
                .dataLocal(dia)
                .valorRealizado(valor)
                .moedasGanhas(0)
                .tipoSucesso("COMPLETE_PADRAO")
                .build());
    }

    private ExecutionRequestDTO conclusao(final int valor) {
        return ExecutionRequestDTO.builder().execution_token(UUID.randomUUID()).valor_realizado(valor).build();
    }

    private List<RespostaDTO> respostasDeAgua(final String vezesAoDia) {
        return List.of(
                new RespostaDTO("CONSUMO_ATUAL", "BASTANTE"),
                new RespostaDTO("LEMBRA_SOZINHO", "QUASE_SEMPRE"),
                new RespostaDTO("GARRAFA_POR_PERTO", "SEMPRE"),
                new RespostaDTO("DIAS_SEMANA", "1111111"),
                new RespostaDTO("VEZES_AO_DIA", vezesAoDia),
                new RespostaDTO("ESTRATEGIA", "LEMBRETE"),
                new RespostaDTO("RITMO", "EQUILIBRADO"));
    }

    // =================================================== DEF-02 (CT156)
    @Test
    void ct156_habitoExcluido_recusaExecucaoEdicaoEscudoEstatisticaENovaExclusao() {
        final var habitoId = criar(habito(1000).build());
        assertEquals(200, delete("/api/habits/" + habitoId, MessageResponseDTO.class).getStatusCode().value());

        assertEquals(404, post("/api/habits/" + habitoId + "/executions", conclusao(1000), MessageResponseDTO.class)
                .getStatusCode().value());
        assertEquals(404, put("/api/habits/" + habitoId, habito(1200).build(), MessageResponseDTO.class)
                .getStatusCode().value());
        assertEquals(404, post("/api/habits/" + habitoId + "/shield", null, MessageResponseDTO.class)
                .getStatusCode().value());
        assertEquals(404, get("/api/stats/monthly?habitoId=" + habitoId, MessageResponseDTO.class)
                .getStatusCode().value());
        assertEquals(404, delete("/api/habits/" + habitoId, MessageResponseDTO.class).getStatusCode().value());
    }

    // =================================================== DEF-10 (CT135)
    @Test
    void ct135_listaDeOcorrenciasMenorQueVezesAoDia_recusaDizendoQuantasEram() {
        final var request = habito(2100)
                .meta_frequencia_diaria(3)
                .horario_agendado(null)
                .ocorrencias(List.of(
                        new OcorrenciaRequestDTO(LocalTime.of(8, 0), null),
                        new OcorrenciaRequestDTO(LocalTime.of(12, 0), null)))
                .build();

        final var resposta = post("/api/habits", request, MessageResponseDTO.class);

        assertEquals(400, resposta.getStatusCode().value());
        assertTrue(resposta.getBody().message().contains("3"), resposta.getBody().message());
    }

    @Test
    void ct135_ocorrenciaSemHorario_recusaIndicandoQualOcorrencia() {
        final var request = habito(2100)
                .meta_frequencia_diaria(3)
                .horario_agendado(null)
                .ocorrencias(List.of(
                        new OcorrenciaRequestDTO(LocalTime.of(8, 0), null),
                        new OcorrenciaRequestDTO(null, null),
                        new OcorrenciaRequestDTO(LocalTime.of(18, 0), null)))
                .build();

        final var resposta = post("/api/habits", request, MessageResponseDTO.class);

        assertEquals(400, resposta.getStatusCode().value());
        assertTrue(resposta.getBody().message().contains("ocorrência 2"), resposta.getBody().message());
    }

    // =================================================== DEF-08 (CT145)
    @Test
    void ct145_maisDeQuatroOcorrencias_geraHorariosDistintosEmIntervalosRegulares() {
        final var sugestao = post("/api/calibration", new CalibracaoRequestDTO("AGUA", respostasDeAgua("6")),
                CalibracaoResponseDTO.class).getBody().sugestao();

        final var horarios = sugestao.ocorrencias().stream()
                .map(CalibracaoResponseDTO.OcorrenciaSugeridaDTO::horario_inicio)
                .toList();
        assertEquals(6, horarios.size());
        assertEquals(6, horarios.stream().distinct().count(), "nenhum horário repetido: " + horarios);
        assertEquals(LocalTime.of(8, 0), horarios.get(0));
        assertEquals(LocalTime.of(20, 0), horarios.get(5));
        for (var i = 1; i < horarios.size(); i++) {
            assertTrue(horarios.get(i).isAfter(horarios.get(i - 1)), "em ordem: " + horarios);
        }
    }

    // =================================================== DEF-09 (CT146)
    @Test
    void ct146_mesmaCalibracaoEnviadaDuasVezes_registraUmaSo() {
        final var primeira = post("/api/calibration", new CalibracaoRequestDTO("AGUA", respostasDeAgua("2")),
                CalibracaoResponseDTO.class).getBody();
        final var segunda = post("/api/calibration", new CalibracaoRequestDTO("AGUA", respostasDeAgua("2")),
                CalibracaoResponseDTO.class).getBody();

        assertEquals(primeira.calibracao_id(), segunda.calibracao_id());
        assertEquals(primeira.sugestao().meta_base(), segunda.sugestao().meta_base());
        final var doUsuario = calibracaoRepository.findAll().stream()
                .filter(c -> c.getUsuarioId().equals(idUsuarioTeste))
                .count();
        assertEquals(1, doUsuario);
    }

    @Test
    void ct146_respostasDiferentes_geramCalibracoesDiferentes() {
        final var primeira = post("/api/calibration", new CalibracaoRequestDTO("AGUA", respostasDeAgua("2")),
                CalibracaoResponseDTO.class).getBody();
        final var segunda = post("/api/calibration", new CalibracaoRequestDTO("AGUA", respostasDeAgua("3")),
                CalibracaoResponseDTO.class).getBody();

        assertNotEquals(primeira.calibracao_id(), segunda.calibracao_id());
    }

    @Test
    void perguntaRespondidaDuasVezes_recusaCom400() {
        final var respostas = new java.util.ArrayList<>(respostasDeAgua("2"));
        respostas.add(new RespostaDTO("RITMO", "RAPIDO"));

        final var resposta = post("/api/calibration", new CalibracaoRequestDTO("AGUA", respostas),
                MessageResponseDTO.class);

        assertEquals(400, resposta.getStatusCode().value());
    }

    // =================================================== DEF-15 (CT147)
    @Test
    void ct147_calibracaoInexistente_recusaACriacaoDoHabito() {
        final var resposta = post("/api/habits", habito(1000).calibracao_id(UUID.randomUUID()).build(),
                MessageResponseDTO.class);

        assertEquals(404, resposta.getStatusCode().value());
        assertTrue(habitoRepository.findAllByUsuarioIdAndAtivoTrue(idUsuarioTeste).isEmpty(),
                "a criação foi desfeita junto");
    }

    @Test
    void ct147_calibracaoJaUsada_recusaOSegundoHabito() {
        final var calibracao = post("/api/calibration", new CalibracaoRequestDTO("AGUA", respostasDeAgua("1")),
                CalibracaoResponseDTO.class).getBody();
        criar(habito(1000).calibracao_id(calibracao.calibracao_id()).build());

        final var resposta = post("/api/habits", habito(1000).calibracao_id(calibracao.calibracao_id()).build(),
                MessageResponseDTO.class);

        assertEquals(422, resposta.getStatusCode().value());
        assertEquals(1, habitoRepository.findAllByUsuarioIdAndAtivoTrue(idUsuarioTeste).size());
    }

    @Test
    void ct147_calibracaoDeOutraCategoria_recusaOHabito() {
        final var calibracao = post("/api/calibration", new CalibracaoRequestDTO("AGUA", respostasDeAgua("1")),
                CalibracaoResponseDTO.class).getBody();
        final var deEstudo = habito(20).categoria("ESTUDO").tipo_medida("TEMPO")
                .calibracao_id(calibracao.calibracao_id()).build();

        assertEquals(422, post("/api/habits", deEstudo, MessageResponseDTO.class).getStatusCode().value());
    }

    // =================================================== DEF-14 (CT192 e CT180)
    @Test
    void ct192_execucaoAcimaDoAlvoDaOcorrenciaMasAbaixoDoDia_naoMarcaBonus() {
        final var habitoId = criar(habito(2100)
                .meta_frequencia_diaria(3)
                .horario_agendado(null)
                .ocorrencias(List.of(
                        new OcorrenciaRequestDTO(LocalTime.of(0, 1), null),
                        new OcorrenciaRequestDTO(LocalTime.of(0, 2), null),
                        new OcorrenciaRequestDTO(LocalTime.of(0, 3), null)))
                .build());

        final var resposta = post("/api/habits/" + habitoId + "/executions", conclusao(840),
                ExecutionResponseDTO.class).getBody();

        assertFalse(resposta.bonus(), "840 de 2100 é 40% do dia");
        assertEquals(0, resposta.moedas_ganhas_agora());
    }

    @Test
    void ct180_umaOcorrenciaA120PorCento_continuaCreditando150ESinalizandoBonus() {
        final var habitoId = criar(habito(1000).build());

        final var resposta = post("/api/habits/" + habitoId + "/executions", conclusao(1200),
                ExecutionResponseDTO.class).getBody();

        assertTrue(resposta.bonus());
        assertEquals(150, resposta.moedas_ganhas_agora());
    }

    @Test
    void bonusAcompanhaOCreditoDoDia_quandoASegundaExecucaoLevaODiaA120PorCento() {
        final var habitoId = criar(habito(1000).build());
        final var primeira = post("/api/habits/" + habitoId + "/executions", conclusao(1000),
                ExecutionResponseDTO.class).getBody();
        final var segunda = post("/api/habits/" + habitoId + "/executions", conclusao(200),
                ExecutionResponseDTO.class).getBody();

        assertFalse(primeira.bonus());
        assertEquals(100, primeira.moedas_ganhas_agora());
        assertTrue(segunda.bonus());
        assertEquals(50, segunda.moedas_ganhas_agora());
    }

    // =================================================== DEF-05 (CT212)
    @Test
    void ct212_metaCumpridaEmDiaForaDaFrequencia_naoLevaAConstanciaAcimaDeCem() {
        final var habitoId = criar(habito(1000).frequencia_semanal("0111110").build());
        for (var i = 0; i < 30; i++) {
            registrarNoHistorico(habitoId, hoje().minusDays(i), 1000);
        }

        final var stats = get("/api/stats/monthly?habitoId=" + habitoId, StatsResponseDTO.class).getBody();

        assertEquals(100, stats.constancia_percentual());
        assertEquals(stats.dias_cobrados(), stats.dias_com_meta_cumprida());
    }

    // =================================================== DEF-07 (CT239)
    @Test
    void ct239_jobQueApuraVariosDiasDeUmaVez_aplicaAProgressaoAoCompletarOCiclo() {
        final var habitoId = criar(habito(1000).incremento(100).dias_incremento(10).build());
        final var status = statusHabitoRepository.findById(habitoId).orElseThrow();
        status.setDiasSeguidos(8);
        status.setUltimoReset(hoje().minusDays(4));
        statusHabitoRepository.save(status);
        for (var i = 1; i <= 3; i++) {
            registrarNoHistorico(habitoId, hoje().minusDays(i), 1200);
        }

        fechamentoDiarioJob.apurarDiasFechados();

        // 8 → 9 → 10 (a meta sobe para 1100 aqui) → 11, com o último dia já julgado pela meta nova.
        assertEquals(11, statusHabitoRepository.findById(habitoId).orElseThrow().getDiasSeguidos());
        assertEquals(1100, habitoRepository.findById(habitoId).orElseThrow().getMetaBase());
    }

    @Test
    void diaDeFolgaComOfensivaNoMultiplo_naoRepeteAProgressao() {
        final var ontem = hoje().minusDays(1);
        final var mascara = new StringBuilder("1111111");
        mascara.setCharAt(ontem.getDayOfWeek().getValue() % 7, '0');
        final var habitoId = criar(habito(1000).incremento(100).dias_incremento(10)
                .frequencia_semanal(mascara.toString()).build());
        final var status = statusHabitoRepository.findById(habitoId).orElseThrow();
        status.setDiasSeguidos(10);
        status.setUltimoReset(hoje().minusDays(2));
        statusHabitoRepository.save(status);

        fechamentoDiarioJob.apurarDiasFechados();

        assertEquals(1000, habitoRepository.findById(habitoId).orElseThrow().getMetaBase());
        assertEquals(10, statusHabitoRepository.findById(habitoId).orElseThrow().getDiasSeguidos());
    }

    // =================================================== DEF-16 (CT103)
    @Test
    void ct103_duasCriacoesSimultaneas_respeitamOLimiteDeDoisHabitos() throws Exception {
        criar(habito(1000).build());
        final var largada = new CyclicBarrier(2);
        final java.util.function.Supplier<Integer> criarJunto = () -> {
            try {
                largada.await();
            } catch (final Exception e) {
                throw new IllegalStateException(e);
            }
            return post("/api/habits", habito(1000).build(), String.class).getStatusCode().value();
        };

        final var a = CompletableFuture.supplyAsync(criarJunto);
        final var b = CompletableFuture.supplyAsync(criarJunto);
        final var status = List.of(a.get(), b.get());

        assertTrue(status.contains(201) && status.contains(422), "uma aceita e uma recusada: " + status);
        assertEquals(2, habitoRepository.findAllByUsuarioIdAndAtivoTrue(idUsuarioTeste).size());
    }

    // =================================================== DEF-12 (CT076)
    @Test
    void ct076_novaSenhaIgualAAtual_eRecusada() {
        final var request = ProfileUpdateDTO.builder()
                .senha_atual(senhaUsuarioTeste)
                .nova_senha(senhaUsuarioTeste)
                .build();

        final var resposta = put("/api/profile", request, MessageResponseDTO.class);

        assertEquals(422, resposta.getStatusCode().value());
        assertTrue(resposta.getBody().message().contains("diferente"));
    }

    // =================================================== Rota inexistente
    @Test
    void rotaInexistenteAutenticada_devolve404EmVezDe500() {
        assertEquals(404, get("/api/rota-que-nao-existe", MessageResponseDTO.class).getStatusCode().value());
    }

    // =================================================== Render gratuito: API acordando
    @Test
    void execucaoNoDiaSeguinteAntesDoJob_naoSomaAosContadoresDeOntem() {
        final var habitoId = criar(habito(1000).build());
        final var ontem = hoje().minusDays(1);
        registrarNoHistorico(habitoId, ontem, 1000);
        final var status = statusHabitoRepository.findById(habitoId).orElseThrow();
        status.setValorAcumuladoHoje(1000);
        status.setMoedasCreditadasHoje(100);
        status.setExecucoesHoje(1);
        status.setUltimoReset(hoje().minusDays(2));
        statusHabitoRepository.save(status);

        final var resposta = post("/api/habits/" + habitoId + "/executions", conclusao(1000),
                ExecutionResponseDTO.class).getBody();

        assertEquals(1000, resposta.valor_acumulado_hoje(), "o total de hoje começa do zero");
        assertEquals(100, resposta.moedas_ganhas_agora());
        assertEquals(1, resposta.dias_seguidos(), "ontem foi apurado antes da execução de hoje");
    }

    @Test
    void escudoManualDeHoje_naoProtegeOntemQuandoOJobAindaNaoRodou() {
        final var habitoId = criar(habito(1000).build());
        final var status = statusHabitoRepository.findById(habitoId).orElseThrow();
        status.setUltimoReset(hoje().minusDays(2));
        status.setDiasSeguidos(5);
        statusHabitoRepository.save(status);

        final var pedido = ExecutionRequestDTO.builder()
                .execution_token(UUID.randomUUID())
                .tipo("FAIL_BLOQUEIO")
                .valor_realizado(0)
                .build();
        assertEquals(200, post("/api/habits/" + habitoId + "/executions", pedido, ExecutionResponseDTO.class)
                .getStatusCode().value());

        final var depois = statusHabitoRepository.findById(habitoId).orElseThrow();
        assertEquals(hoje().minusDays(1), depois.getUltimoReset());
        assertTrue(depois.getBloqueioUsadoHoje(), "o escudo manual continua valendo para hoje");
        assertEquals(1, depois.getBloqueiosAcumulados(), "um escudo automático para ontem e o manual de hoje");
        assertEquals(5, depois.getDiasSeguidos());
    }

    @Test
    void painelLidoNoDiaSeguinte_mostraOsContadoresDeHojeZerados() {
        final var habitoId = criar(habito(1000).build());
        final var status = statusHabitoRepository.findById(habitoId).orElseThrow();
        status.setValorAcumuladoHoje(600);
        status.setExecucoesHoje(1);
        status.setUltimoReset(hoje().minusDays(2));
        statusHabitoRepository.save(status);

        final var painel = get("/api/dashboard", com.rodrigo.backend2java.habito.model.DashboardResponseDTO.class)
                .getBody();
        final var doHabito = painel.habits().stream().filter(h -> h.id().equals(habitoId)).findFirst().orElseThrow();

        assertEquals(0, doHabito.valor_acumulado_hoje());
        assertEquals(0, doHabito.execucoes_hoje());
        assertEquals(hoje().minusDays(1), statusHabitoRepository.findById(habitoId).orElseThrow().getUltimoReset());
    }

    @Test
    void habitoNovo_nasceComOsContadoresPertencendoAoDiaDaCriacao() {
        final var habitoId = criar(habito(1000).build());

        assertEquals(hoje().minusDays(1), statusHabitoRepository.findById(habitoId).orElseThrow().getUltimoReset());
    }

    @Test
    void diaDaCriacaoSemMetaCumprida_naoConsomeEscudo() {
        final var habitoId = criar(habito(1000).build());
        final var habito = habitoRepository.findById(habitoId).orElseThrow();
        habito.setCriadoEm(OffsetDateTime.now(FUSO_PADRAO).minusDays(1));
        habitoRepository.save(habito);
        final var status = statusHabitoRepository.findById(habitoId).orElseThrow();
        status.setUltimoReset(hoje().minusDays(2));
        statusHabitoRepository.save(status);

        fechamentoDiarioJob.apurarDiasFechados();

        final var depois = statusHabitoRepository.findById(habitoId).orElseThrow();
        assertEquals(3, depois.getBloqueiosAcumulados());
        assertEquals(hoje().minusDays(1), depois.getUltimoReset());
    }

    @Test
    void diaDaCriacaoComMetaCumprida_contaNaOfensiva() {
        final var habitoId = criar(habito(1000).build());
        final var habito = habitoRepository.findById(habitoId).orElseThrow();
        habito.setCriadoEm(OffsetDateTime.now(FUSO_PADRAO).minusDays(1));
        habitoRepository.save(habito);
        registrarNoHistorico(habitoId, hoje().minusDays(1), 1000);
        final var status = statusHabitoRepository.findById(habitoId).orElseThrow();
        status.setUltimoReset(hoje().minusDays(2));
        statusHabitoRepository.save(status);

        fechamentoDiarioJob.apurarDiasFechados();

        assertEquals(1, statusHabitoRepository.findById(habitoId).orElseThrow().getDiasSeguidos());
    }
}
