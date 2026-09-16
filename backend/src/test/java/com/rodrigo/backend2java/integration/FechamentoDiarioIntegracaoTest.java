package com.rodrigo.backend2java.integration;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import com.rodrigo.backend2java.BaseAPIIntegracaoTest;
import com.rodrigo.backend2java.habito.HabitoRequestDTO;
import com.rodrigo.backend2java.habito.HabitoResponseDTO;
import com.rodrigo.backend2java.habito.HabitoRepository;
import com.rodrigo.backend2java.execucao.HistoricoExecucao;
import com.rodrigo.backend2java.execucao.HistoricoExecucaoRepository;
import com.rodrigo.backend2java.execucao.StatusHabitoRepository;
import com.rodrigo.backend2java.habito.SubAtividadeRepository;
import com.rodrigo.backend2java.habito.FechamentoDiarioJob;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * O fechamento do dia: onde as moedas são creditadas (RF11/RF12), a ofensiva se
 * move (RF13) e o nível do avatar sobe (RF14).
 *
 * <p>Os testes montam o histórico de <b>ontem</b> direto no repositório, porque o
 * job só fecha dias que já terminaram — o dia corrente continua em andamento.
 */
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

    /** Uma conclusão registrada num dia específico, atribuída a uma ocorrência. */
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

    /** Faz o job enxergar {@code dia} como pendente de apuração. */
    private void marcarPendente(final UUID habitoId, final LocalDate dia) {
        final var status = statusHabitoRepository.findById(habitoId).orElseThrow();
        status.setUltimoReset(dia.minusDays(1));
        statusHabitoRepository.save(status);
    }

    @Test
    void diaComMetaCumprida_credita100EAvancaAOfensiva() {
        final var habitoId = criarHabito(1000, 1);
        registrarConclusao(habitoId, 0, ontem(), 1000);
        marcarPendente(habitoId, ontem());

        fechamentoDiarioJob.apurarDiasFechados();

        final var status = statusHabitoRepository.findById(habitoId).orElseThrow();
        assertEquals(100, status.getMoedasLocais());
        assertEquals(1, status.getDiasSeguidos());
        assertEquals(1, status.getNivelAvatar(), "RF14: o nível só sobe a cada 10 dias");
        assertEquals(0, status.getExecucoesHoje());
        assertEquals(0, status.getValorAcumuladoHoje());
        assertFalse(status.getBloqueioUsadoHoje());
        assertEquals(ontem(), status.getUltimoReset());
    }

    @Test
    void diaAcimaDe120PorCentoDaMeta_credita150() {
        final var habitoId = criarHabito(1000, 1);
        registrarConclusao(habitoId, 0, ontem(), 1200);
        marcarPendente(habitoId, ontem());

        fechamentoDiarioJob.apurarDiasFechados();

        assertEquals(150, statusHabitoRepository.findById(habitoId).orElseThrow().getMoedasLocais());
    }

    /** RF12: meta batida pulando uma ocorrência mantém a ofensiva, sem as moedas da parte ausente. */
    @Test
    void metaBatidaPulandoUmaDeTresOcorrencias_mantemOfensivaECreditaDoisTercos() {
        final var habitoId = criarHabito(2100, 3);
        registrarConclusao(habitoId, 0, ontem(), 1050);
        registrarConclusao(habitoId, 1, ontem(), 1050);
        marcarPendente(habitoId, ontem());

        fechamentoDiarioJob.apurarDiasFechados();

        final var status = statusHabitoRepository.findById(habitoId).orElseThrow();
        assertEquals(67, status.getMoedasLocais(), "duas das três cotas de 33,3");
        assertEquals(1, status.getDiasSeguidos(), "o total do dia bateu a meta");
    }

    /** "Fez menos, ganha menos": 60% da meta credita 60 e não sustenta a ofensiva. */
    @Test
    void diaAbaixoDaMeta_creditaProporcionalEZeraAOfensiva() {
        final var habitoId = criarHabito(1000, 1);
        final var status = statusHabitoRepository.findById(habitoId).orElseThrow();
        status.setDiasSeguidos(4);
        // PLANO_REESTRUTURACAO.md, H: todo hábito novo já nasce com 3 escudos:
        // sem zerar aqui, o fechamento protegeria o dia sozinho (PROTEGIDO_
        // AUTOMATICO) e a ofensiva NÃO zeraria — o oposto do que este teste
        // existe para verificar (o caminho sem proteção nenhuma).
        status.setBloqueiosAcumulados(0);
        statusHabitoRepository.save(status);

        registrarConclusao(habitoId, 0, ontem(), 600);
        marcarPendente(habitoId, ontem());

        fechamentoDiarioJob.apurarDiasFechados();

        final var depois = statusHabitoRepository.findById(habitoId).orElseThrow();
        assertEquals(60, depois.getMoedasLocais());
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

    /** RF14: o avatar evolui a cada dez dias, não a cada dia. */
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

    /** Dia fora da máscara semanal não é dia de falha: não avalia, não credita, não zera. */
    @Test
    void diaForaDaFrequenciaSemanal_naoZeraAOfensivaNemCredita() {
        final var ontem = ontem();
        // Máscara com o dia de ontem desmarcado e todos os outros marcados.
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
    void fechamentoRodadoDuasVezes_naoCreditaDuasVezes() {
        final var habitoId = criarHabito(1000, 1);
        registrarConclusao(habitoId, 0, ontem(), 1000);
        marcarPendente(habitoId, ontem());

        fechamentoDiarioJob.apurarDiasFechados();
        fechamentoDiarioJob.apurarDiasFechados();

        final var status = statusHabitoRepository.findById(habitoId).orElseThrow();
        assertEquals(100, status.getMoedasLocais());
        assertEquals(1, status.getDiasSeguidos());
    }

    /** O job pode ficar dias sem rodar (a instância do Render suspende): os dias vazios do meio contam como falha. */
    @Test
    void diasPuladosSemExecucao_zeramAOfensiva() {
        final var habitoId = criarHabito(1000, 1);
        final var status = statusHabitoRepository.findById(habitoId).orElseThrow();
        status.setDiasSeguidos(6);
        status.setUltimoReset(LocalDate.now(FUSO_PADRAO).minusDays(4));
        // PLANO_REESTRUTURACAO.md, H: idem ao teste acima — sem zerar os 3
        // escudos iniciais, o fechamento protegeria dias pulados sozinho e a
        // ofensiva não chegaria a zero.
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
