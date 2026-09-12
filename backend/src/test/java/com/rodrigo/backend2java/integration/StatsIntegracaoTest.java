package com.rodrigo.backend2java.integration;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import com.rodrigo.backend2java.BaseAPIIntegracaoTest;
import com.rodrigo.backend2java.execucao.HistoricoExecucao;
import com.rodrigo.backend2java.habito.HabitoRequestDTO;
import com.rodrigo.backend2java.habito.HabitoResponseDTO;
import com.rodrigo.backend2java.stats.StatsResponseDTO;
import com.rodrigo.backend2java.execucao.HistoricoExecucaoRepository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Acompanhamento de desempenho (RF17, F16–F20), agora mensal.
 */
class StatsIntegracaoTest extends BaseAPIIntegracaoTest {

    /** O mesmo fuso que o usuário de teste recebe no cadastro. */
    private static final ZoneId FUSO_PADRAO = ZoneId.of("America/Sao_Paulo");

    private static final int DIAS_JANELA = 30;

    @Autowired
    private HistoricoExecucaoRepository historicoExecucaoRepository;

    private UUID criarHabito() {
        final var request = HabitoRequestDTO.builder()
                .titulo("Hábito de stats")
                .categoria("AGUA")
                .meta_base(2000)
                .tipo_medida("QUANTIDADE")
                .meta_frequencia_diaria(1)
                .horario_agendado(LocalTime.of(8, 0))
                .build();
        return post("/api/habits", request, HabitoResponseDTO.class).getBody().id();
    }

    private void registrarHistorico(final UUID habitoId, final LocalDate dataLocal, final String tipoSucesso,
            final int valorRealizado) {
        historicoExecucaoRepository.save(HistoricoExecucao.builder()
                .id(UUID.randomUUID())
                .habitoId(habitoId)
                .executionToken(UUID.randomUUID())
                .dataHoraExecucao(OffsetDateTime.now())
                .dataLocal(dataLocal)
                .valorRealizado(valorRealizado)
                .moedasGanhas(0)
                .tipoSucesso(tipoSucesso)
                .build());
    }

    @Test
    void statsMensais_agregamTrintaDiasComDiaCompletoDiaParcialEDiaVazio() {
        final var habitoId = criarHabito();
        final var hoje = LocalDate.now(FUSO_PADRAO);

        registrarHistorico(habitoId, hoje, "COMPLETE_PADRAO", 2000);
        registrarHistorico(habitoId, hoje.minusDays(1), "DESISTENCIA", 500);

        final var resposta = get("/api/stats/monthly?habitoId=" + habitoId, StatsResponseDTO.class);

        final var dias = resposta.getBody().dias();
        assertEquals(DIAS_JANELA, dias.size());
        assertEquals(DIAS_JANELA, resposta.getBody().dias_periodo());
        assertEquals(hoje.minusDays(DIAS_JANELA - 1L), dias.get(0).data());
        assertEquals(hoje, dias.get(DIAS_JANELA - 1).data());

        final var diaCompleto = dias.get(DIAS_JANELA - 1);
        assertEquals(2000, diaCompleto.valor_realizado());
        assertEquals(1, diaCompleto.execucoes());
        assertTrue(diaCompleto.meta_cumprida());
        assertFalse(diaCompleto.parcial());

        final var diaParcial = dias.get(DIAS_JANELA - 2);
        assertEquals(500, diaParcial.valor_realizado());
        assertEquals(0, diaParcial.execucoes());
        assertFalse(diaParcial.meta_cumprida());
        assertTrue(diaParcial.parcial());

        final var diaVazio = dias.get(0);
        assertEquals(0, diaVazio.valor_realizado());
        assertFalse(diaVazio.meta_cumprida());
        assertFalse(diaVazio.parcial());

        assertEquals(1, resposta.getBody().dias_com_meta_cumprida());
    }

    /** F18: os três maiores dias do mês, com data — e sem exigir meta cumprida. */
    @Test
    void recordes_trazemOsTresMaioresDiasComDataIncluindoDiaAbaixoDaMeta() {
        final var habitoId = criarHabito();
        final var hoje = LocalDate.now(FUSO_PADRAO);

        registrarHistorico(habitoId, hoje.minusDays(2), "COMPLETE_PADRAO", 3000);
        registrarHistorico(habitoId, hoje.minusDays(5), "COMPLETE_PADRAO", 1800);
        registrarHistorico(habitoId, hoje.minusDays(8), "COMPLETE_PADRAO", 2500);
        registrarHistorico(habitoId, hoje.minusDays(11), "COMPLETE_PADRAO", 900);

        final var recordes = get("/api/stats/monthly?habitoId=" + habitoId, StatsResponseDTO.class)
                .getBody().recordes();

        assertEquals(3, recordes.size());
        assertEquals(3000, recordes.get(0).valor());
        assertEquals(hoje.minusDays(2), recordes.get(0).data());
        assertEquals(2500, recordes.get(1).valor());
        assertEquals(hoje.minusDays(8), recordes.get(1).data());
        // 1800 está abaixo da meta de 2000 e ainda assim é o terceiro maior dia.
        assertEquals(1800, recordes.get(2).valor());
        assertEquals(hoje.minusDays(5), recordes.get(2).data());
    }

    /** RF07/RF13: o dia se fecha pelo total, não pela contagem de execuções. */
    @Test
    void metaCumprida_olhaOTotalDoDiaSomandoOcorrencias() {
        final var habitoId = criarHabito();
        final var ontem = LocalDate.now(FUSO_PADRAO).minusDays(1);

        registrarHistorico(habitoId, ontem, "COMPLETE_PADRAO", 1200);
        registrarHistorico(habitoId, ontem, "COMPLETE_PADRAO", 800);

        final var dias = get("/api/stats/monthly?habitoId=" + habitoId, StatsResponseDTO.class)
                .getBody().dias();
        final var diaDeOntem = dias.get(DIAS_JANELA - 2);

        assertEquals(2000, diaDeOntem.valor_realizado());
        assertTrue(diaDeOntem.meta_cumprida());
    }

    /**
     * Um hábito de segunda a sexta não pode ser penalizado pelos fins de semana: o
     * fechamento nem avalia a meta neles. Antes desta correção, a constância dividia
     * por 30 e travava em ~71% mesmo sem uma falha sequer — a tela de estatísticas
     * contradizia a ofensiva sobre a mesma semana.
     */
    @Test
    void constancia_ignoraOsDiasForaDaFrequenciaSemanal() {
        final var request = HabitoRequestDTO.builder()
                .titulo("Só dias úteis")
                .categoria("ESTUDO")
                .meta_base(25)
                .tipo_medida("TEMPO")
                .meta_frequencia_diaria(1)
                .horario_agendado(LocalTime.of(20, 0))
                .frequencia_semanal("0111110")
                .build();
        final var habitoId = post("/api/habits", request, HabitoResponseDTO.class).getBody().id();

        final var resposta = get("/api/stats/monthly?habitoId=" + habitoId, StatsResponseDTO.class).getBody();

        assertEquals(DIAS_JANELA, resposta.dias_periodo());
        assertTrue(resposta.dias_cobrados() < DIAS_JANELA, "fins de semana ficam fora do denominador");
        assertTrue(resposta.dias_cobrados() >= 20 && resposta.dias_cobrados() <= 23,
                "30 dias contêm de 20 a 23 dias úteis; veio " + resposta.dias_cobrados());

        final var diasDeFolga = resposta.dias().stream().filter(d -> !d.dia_programado()).count();
        assertEquals(DIAS_JANELA - resposta.dias_cobrados(), diasDeFolga);
    }

    @Test
    void rotaAntigaWeekly_continuaRespondendoOMesmoConteudo() {
        final var habitoId = criarHabito();

        final var resposta = get("/api/stats/weekly?habitoId=" + habitoId, StatsResponseDTO.class);

        assertEquals(DIAS_JANELA, resposta.getBody().dias().size());
    }
}
