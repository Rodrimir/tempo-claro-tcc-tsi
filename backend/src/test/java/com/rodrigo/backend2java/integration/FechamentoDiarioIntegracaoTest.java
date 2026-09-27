package com.rodrigo.backend2java.integration;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import com.rodrigo.backend2java.BaseAPIIntegracaoTest;
import com.rodrigo.backend2java.habito.model.HabitoRequestDTO;
import com.rodrigo.backend2java.habito.model.HabitoResponseDTO;
import com.rodrigo.backend2java.habito.HabitoRepository;
import com.rodrigo.backend2java.execucao.model.HistoricoExecucao;
import com.rodrigo.backend2java.execucao.HistoricoExecucaoRepository;
import com.rodrigo.backend2java.execucao.StatusHabitoRepository;
import com.rodrigo.backend2java.habito.SubAtividadeRepository;
import com.rodrigo.backend2java.habito.FechamentoDiarioJob;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class FechamentoDiarioIntegracaoTest extends BaseAPIIntegracaoTest {

    private static final ZoneId FUSO_PADRAO = ZoneId.of("America/Sao_Paulo");

    @Autowired
    private FechamentoDiarioJob fechamentoDiarioJob;

    @Autowired
    private StatusHabitoRepository statusHabitoRepository;

    @Autowired
    private HabitoRepository habitoRepository;

    @Autowired
    private SubAtividadeRepository subAtividadeRepository;

    @Autowired
    private HistoricoExecucaoRepository historicoExecucaoRepository;

    private LocalDate ontem() {
        return LocalDate.now(FUSO_PADRAO).minusDays(1);
    }

    private UUID criarHabito(final int metaBase, final int vezesAoDia) {
        return criarHabito(metaBase, vezesAoDia, null, 0, 10, "1111111");
    }

    private UUID criarHabito(final int metaBase, final int vezesAoDia, final Integer metaMaxima,
            final Integer incremento, final Integer diasIncremento, final String frequenciaSemanal) {
        final var ocorrencias = new java.util.ArrayList<HabitoRequestDTO.OcorrenciaRequestDTO>();
        for (var i = 0; i < vezesAoDia; i++) {
            ocorrencias.add(new HabitoRequestDTO.OcorrenciaRequestDTO(LocalTime.of(8 + i, 0), null));
        }
        final var request = HabitoRequestDTO.builder()
                .titulo("Hábito de fechamento")
                .categoria("AGUA")
                .meta_base(metaBase)
                .tipo_medida("QUANTIDADE")
                .meta_frequencia_diaria(vezesAoDia)
                .horario_agendado(LocalTime.of(8, 0))
                .ocorrencias(ocorrencias)
                .meta_maxima(metaMaxima)
                .incremento(incremento)
                .dias_incremento(diasIncremento)
                .frequencia_semanal(frequenciaSemanal)
                .build();
        return post("/api/habits", request, HabitoResponseDTO.class).getBody().id();
    }

    private void registrarConclusao(final UUID habitoId, final int indiceOcorrencia, final LocalDate dia,
            final int valor) {
        final var ocorrencia = subAtividadeRepository.findAllByHabitoIdOrderByOrdem(habitoId)
                .get(indiceOcorrencia);
        historicoExecucaoRepository.save(HistoricoExecucao.builder()
                .id(UUID.randomUUID())
                .habitoId(habitoId)
                .subAtividadeId(ocorrencia.getId())
                .executionToken(UUID.randomUUID())
                .dataLocal(dia)
                .valorRealizado(valor)
                .moedasGanhas(0)
                .tipoSucesso("COMPLETE_PADRAO")
                .build());
    }

    private void marcarPendente(final UUID habitoId, final LocalDate dia) {
        final var status = statusHabitoRepository.findById(habitoId).orElseThrow();
        status.setUltimoReset(dia.minusDays(1));
        statusHabitoRepository.save(status);
    }

    @Test
    void diaComMetaCumprida_avancaAOfensivaSemCreditarMoedas() {
        final var habitoId = criarHabito(1000, 1);
        registrarConclusao(habitoId, 0, ontem(), 1000);
        marcarPendente(habitoId, ontem());

        fechamentoDiarioJob.apurarDiasFechados();

        final var status = statusHabitoRepository.findById(habitoId).orElseThrow();
        assertEquals(0, status.getMoedasLocais(),
                "o fechamento não credita mais moedas — isso é responsabilidade da execução (RF11 revisado)");
        assertEquals(1, status.getDiasSeguidos());
        assertEquals(1, status.getNivelAvatar(), "RF14: o nível só sobe a cada 10 dias");
        assertEquals(0, status.getExecucoesHoje());
        assertEquals(0, status.getValorAcumuladoHoje());
        assertEquals(0, status.getMoedasCreditadasHoje(), "zerado junto com os outros contadores diários");
        assertFalse(status.getBloqueioUsadoHoje());
        assertEquals(ontem(), status.getUltimoReset());
    }

    @Test
    void metaBatidaPulandoUmaDeTresOcorrencias_mantemOfensiva() {
        final var habitoId = criarHabito(2100, 3);
        registrarConclusao(habitoId, 0, ontem(), 1050);
        registrarConclusao(habitoId, 1, ontem(), 1050);
        marcarPendente(habitoId, ontem());

        fechamentoDiarioJob.apurarDiasFechados();

        final var status = statusHabitoRepository.findById(habitoId).orElseThrow();
        assertEquals(1, status.getDiasSeguidos(), "o total do dia bateu a meta, mesmo faltando uma ocorrência");
    }

    @Test
    void diaAbaixoDaMeta_zeraAOfensiva() {
        final var habitoId = criarHabito(1000, 1);
        final var status = statusHabitoRepository.findById(habitoId).orElseThrow();
        status.setDiasSeguidos(4);
        status.setBloqueiosAcumulados(0);
        statusHabitoRepository.save(status);

        registrarConclusao(habitoId, 0, ontem(), 600);
        marcarPendente(habitoId, ontem());

        fechamentoDiarioJob.apurarDiasFechados();

        final var depois = statusHabitoRepository.findById(habitoId).orElseThrow();
        assertEquals(0, depois.getDiasSeguidos());
    }

    @Test
    void diaAbaixoDaMeta_comEscudoDisponivel_consomeOEscudoEPreservaAOfensiva() {
        final var habitoId = criarHabito(1000, 1);
        final var status = statusHabitoRepository.findById(habitoId).orElseThrow();
        status.setDiasSeguidos(4);
        status.setBloqueiosAcumulados(1);
        statusHabitoRepository.save(status);

        marcarPendente(habitoId, ontem());

        fechamentoDiarioJob.apurarDiasFechados();

        final var depois = statusHabitoRepository.findById(habitoId).orElseThrow();
        assertEquals(4, depois.getDiasSeguidos(), "escudo preserva a ofensiva");
        assertEquals(0, depois.getBloqueiosAcumulados());
        assertTrue(historicoExecucaoRepository.agregarDesistenciasPorDia(habitoId, ontem(), ontem()).size() > 0,
                "o consumo automático deixa rastro PROTEGIDO_AUTOMATICO");
    }

    @Test
    void decimoDiaSeguido_sobeONivelDoAvatar() {
        final var habitoId = criarHabito(1000, 1);
        final var status = statusHabitoRepository.findById(habitoId).orElseThrow();
        status.setDiasSeguidos(9);
        statusHabitoRepository.save(status);

        registrarConclusao(habitoId, 0, ontem(), 1000);
        marcarPendente(habitoId, ontem());

        fechamentoDiarioJob.apurarDiasFechados();

        final var depois = statusHabitoRepository.findById(habitoId).orElseThrow();
        assertEquals(10, depois.getDiasSeguidos());
        assertEquals(2, depois.getNivelAvatar());
    }

    @Test
    void ofensivaZerando_naoDerrubaNivelJaConquistado() {
        final var habitoId = criarHabito(1000, 1);
        final var status = statusHabitoRepository.findById(habitoId).orElseThrow();
        status.setDiasSeguidos(10);
        status.setNivelAvatar(2);
        status.setBloqueiosAcumulados(0);
        statusHabitoRepository.save(status);

        marcarPendente(habitoId, ontem());

        fechamentoDiarioJob.apurarDiasFechados();

        final var depois = statusHabitoRepository.findById(habitoId).orElseThrow();
        assertEquals(0, depois.getDiasSeguidos());
        assertEquals(2, depois.getNivelAvatar(), "o nível conquistado antes não regride");
    }

    @Test
    void retornarA10DiasApósJaTerSubido_somaOutroNivel() {
        final var habitoId = criarHabito(1000, 1);
        final var status = statusHabitoRepository.findById(habitoId).orElseThrow();
        status.setDiasSeguidos(9);
        status.setNivelAvatar(2);
        statusHabitoRepository.save(status);

        registrarConclusao(habitoId, 0, ontem(), 1000);
        marcarPendente(habitoId, ontem());

        fechamentoDiarioJob.apurarDiasFechados();

        final var depois = statusHabitoRepository.findById(habitoId).orElseThrow();
        assertEquals(10, depois.getDiasSeguidos());
        assertEquals(3, depois.getNivelAvatar(), "mais um múltiplo de 10, mais um nível — soma sobre o 2 anterior");
    }

    @Test
    void nivelPodeUltrapassarCinco() {
        final var habitoId = criarHabito(1000, 1);
        final var status = statusHabitoRepository.findById(habitoId).orElseThrow();
        status.setDiasSeguidos(49);
        status.setNivelAvatar(5);
        statusHabitoRepository.save(status);

        registrarConclusao(habitoId, 0, ontem(), 1000);
        marcarPendente(habitoId, ontem());

        fechamentoDiarioJob.apurarDiasFechados();

        assertEquals(6, statusHabitoRepository.findById(habitoId).orElseThrow().getNivelAvatar());
    }

    @Test
    void diaProtegidoPeloEscudo_naoSobeNivel() {
        final var habitoId = criarHabito(1000, 1);
        final var status = statusHabitoRepository.findById(habitoId).orElseThrow();
        status.setDiasSeguidos(9);
        status.setNivelAvatar(1);
        status.setBloqueiosAcumulados(1);
        statusHabitoRepository.save(status);

        marcarPendente(habitoId, ontem());

        fechamentoDiarioJob.apurarDiasFechados();

        final var depois = statusHabitoRepository.findById(habitoId).orElseThrow();
        assertEquals(9, depois.getDiasSeguidos(), "escudo preserva, não avança");
        assertEquals(1, depois.getNivelAvatar(), "proteção não é meta cumprida — o nível não sobe");
    }

    @Test
    void diaForaDaFrequenciaSemanal_naoZeraAOfensivaNemCredita() {
        final var ontem = ontem();
        final var indiceOntem = ontem.getDayOfWeek().getValue() % 7;
        final var mascara = new StringBuilder("1111111");
        mascara.setCharAt(indiceOntem, '0');

        final var habitoId = criarHabito(1000, 1, null, 0, 10, mascara.toString());
        final var status = statusHabitoRepository.findById(habitoId).orElseThrow();
        status.setDiasSeguidos(4);
        statusHabitoRepository.save(status);

        marcarPendente(habitoId, ontem);

        fechamentoDiarioJob.apurarDiasFechados();

        final var depois = statusHabitoRepository.findById(habitoId).orElseThrow();
        assertEquals(4, depois.getDiasSeguidos());
        assertEquals(0, depois.getMoedasLocais());
        assertEquals(ontem, depois.getUltimoReset());
    }

    @Test
    void fechamentoRodadoDuasVezes_naoAvancaAOfensivaDuasVezes() {
        final var habitoId = criarHabito(1000, 1);
        registrarConclusao(habitoId, 0, ontem(), 1000);
        marcarPendente(habitoId, ontem());

        fechamentoDiarioJob.apurarDiasFechados();
        fechamentoDiarioJob.apurarDiasFechados();

        final var status = statusHabitoRepository.findById(habitoId).orElseThrow();
        assertEquals(1, status.getDiasSeguidos());
    }

    @Test
    void diasPuladosSemExecucao_zeramAOfensiva() {
        final var habitoId = criarHabito(1000, 1);
        final var status = statusHabitoRepository.findById(habitoId).orElseThrow();
        status.setDiasSeguidos(6);
        status.setUltimoReset(LocalDate.now(FUSO_PADRAO).minusDays(4));
        status.setBloqueiosAcumulados(0);
        statusHabitoRepository.save(status);

        fechamentoDiarioJob.apurarDiasFechados();

        final var depois = statusHabitoRepository.findById(habitoId).orElseThrow();
        assertEquals(0, depois.getDiasSeguidos());
        assertEquals(ontem(), depois.getUltimoReset(), "apurou até ontem, não até hoje");
    }

    @Test
    void progressaoDeMeta_aumentaMetaBaseERegeneraSubAtividades() {
        final var habitoId = criarHabito(1000, 1, 3000, 500, 1, "1111111");
        registrarConclusao(habitoId, 0, ontem(), 1000);
        marcarPendente(habitoId, ontem());

        fechamentoDiarioJob.apurarDiasFechados();

        final var habito = habitoRepository.findById(habitoId).orElseThrow();
        assertEquals(1500, habito.getMetaBase());
        final var subAtividades = subAtividadeRepository.findAllByHabitoIdOrderByOrdem(habitoId);
        assertEquals(1, subAtividades.size());
        assertEquals(1500, subAtividades.get(0).getAlvo());
    }

    @Test
    void progressaoDeMeta_naoUltrapassaMetaMaxima() {
        final var habitoId = criarHabito(1000, 1, 1200, 500, 1, "1111111");
        registrarConclusao(habitoId, 0, ontem(), 1000);
        marcarPendente(habitoId, ontem());

        fechamentoDiarioJob.apurarDiasFechados();

        assertEquals(1200, habitoRepository.findById(habitoId).orElseThrow().getMetaBase());
    }
}
