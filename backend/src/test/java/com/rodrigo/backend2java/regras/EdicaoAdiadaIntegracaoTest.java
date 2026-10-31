package com.rodrigo.backend2java.regras;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import com.rodrigo.backend2java.BaseAPIIntegracaoTest;
import com.rodrigo.backend2java.execucao.HistoricoExecucaoRepository;
import com.rodrigo.backend2java.execucao.StatusHabitoRepository;
import com.rodrigo.backend2java.execucao.model.HistoricoExecucao;
import com.rodrigo.backend2java.habito.ConfigPendenteRepository;
import com.rodrigo.backend2java.habito.HabitoRepository;
import com.rodrigo.backend2java.habito.SubAtividadeRepository;
import com.rodrigo.backend2java.habito.model.DashboardResponseDTO;
import com.rodrigo.backend2java.habito.model.HabitoRequestDTO;
import com.rodrigo.backend2java.habito.model.HabitoRequestDTO.OcorrenciaRequestDTO;
import com.rodrigo.backend2java.habito.model.HabitoResponseDTO;
import com.rodrigo.backend2java.infra.exception.MessageResponseDTO;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Edição adiada (pedido de 16/10/2026): a configuração de execução editada só vale a partir do dia
 * seguinte no fuso do usuário. Título e gatilho mudam na hora. O dia em andamento fecha com a
 * configuração com que começou.
 */
class EdicaoAdiadaIntegracaoTest extends BaseAPIIntegracaoTest {

    private static final ZoneId SP = ZoneId.of("America/Sao_Paulo");

    @Autowired
    private HabitoRepository habitoRepository;

    @Autowired
    private SubAtividadeRepository subAtividadeRepository;

    @Autowired
    private StatusHabitoRepository statusHabitoRepository;

    @Autowired
    private HistoricoExecucaoRepository historicoExecucaoRepository;

    @Autowired
    private ConfigPendenteRepository configPendenteRepository;

    private HabitoRequestDTO.HabitoRequestDTOBuilder agua(final int meta) {
        return HabitoRequestDTO.builder()
                .titulo("Água").categoria("AGUA").tipo_medida("QUANTIDADE").meta_base(meta)
                .meta_frequencia_diaria(1).horario_agendado(LocalTime.of(23, 59)).frequencia_semanal("1111111");
    }

    private UUID criar(final HabitoRequestDTO request) {
        return post("/api/habits", request, HabitoResponseDTO.class).getBody().id();
    }

    private HabitoResponseDTO noPainel(final UUID habitoId) {
        return get("/api/dashboard", DashboardResponseDTO.class).getBody().habits().stream()
                .filter(h -> h.id().equals(habitoId)).findFirst().orElseThrow();
    }

    private void editar(final UUID habitoId, final HabitoRequestDTO request) {
        assertEquals(200, put("/api/habits/" + habitoId, request, Object.class).getStatusCode().value());
    }

    @Test
    void editar_hojeContinuaIgual_eOPainelMostraAPendencia() {
        final var id = criar(agua(1000).build());

        editar(id, agua(2000).meta_frequencia_diaria(2).horario_agendado(null)
                .ocorrencias(List.of(new OcorrenciaRequestDTO(LocalTime.of(9, 0), null),
                        new OcorrenciaRequestDTO(LocalTime.of(15, 0), LocalTime.of(16, 0))))
                .build());

        final var painel = noPainel(id);
        assertEquals(1000, painel.meta_base());
        assertEquals(1, painel.ocorrencias().size());
        final var pendente = painel.alteracao_pendente();
        assertNotNull(pendente);
        assertEquals(LocalDate.now(SP).plusDays(1), pendente.vigente_em());
        assertEquals(2000, pendente.meta_base());
        assertEquals(2, pendente.meta_frequencia_diaria());
        assertEquals(LocalTime.of(16, 0), pendente.ocorrencias().get(1).horario_fim());
    }

    @Test
    void tituloEGatilho_mudamNaHora_semCriarPendencia() {
        final var id = criar(agua(1000).build());

        editar(id, agua(1000).titulo("Água da manhã").gatilho_ancora("Depois do café").build());

        final var painel = noPainel(id);
        assertEquals("Água da manhã", painel.titulo());
        assertEquals("Depois do café", painel.gatilho_ancora());
        assertNull(painel.alteracao_pendente());
    }

    @Test
    void naVirada_oDiaAntigoFechaComAConfiguracaoAntiga_eDepoisANovaEntra() {
        final var id = criar(agua(1000).build());
        editar(id, agua(2000).build());

        // Simula a virada: o dia da edição passa a ser ontem. Ontem foram feitos 1000 ml, que
        // cumprem a meta antiga (1000) e não cumpririam a nova (2000).
        final var ontem = LocalDate.now(SP).minusDays(1);
        final var habito = habitoRepository.findById(id).orElseThrow();
        habito.setCriadoEm(OffsetDateTime.now().minusDays(5));
        habitoRepository.save(habito);
        final var status = statusHabitoRepository.findById(id).orElseThrow();
        status.setUltimoReset(ontem.minusDays(1));
        statusHabitoRepository.save(status);
        historicoExecucaoRepository.save(HistoricoExecucao.builder()
                .id(UUID.randomUUID()).habitoId(id).executionToken(UUID.randomUUID())
                .dataHoraExecucao(OffsetDateTime.now()).dataLocal(ontem).valorRealizado(1000).moedasGanhas(100)
                .tipoSucesso("COMPLETE_PADRAO").build());
        final var pendente = configPendenteRepository.findById(id).orElseThrow();
        pendente.setVigenteEm(LocalDate.now(SP));
        configPendenteRepository.save(pendente);

        final var painel = noPainel(id);

        assertEquals(1, painel.dias_seguidos(), "ontem fechou com a meta antiga");
        assertEquals(2000, painel.meta_base(), "hoje já vale a meta nova");
        assertNull(painel.alteracao_pendente());
        assertTrue(configPendenteRepository.findById(id).isEmpty());
    }

    @Test
    void editarDuasVezes_ficaSoAUltima() {
        final var id = criar(agua(1000).build());

        editar(id, agua(1500).build());
        editar(id, agua(1800).build());

        assertEquals(1800, configPendenteRepository.findById(id).orElseThrow().getMetaBase());
        assertEquals(1, configPendenteRepository.findAllByHabitoIdIn(List.of(id)).size());
    }

    @Test
    void voltarAConfiguracaoEmVigor_cancelaAPendencia() {
        final var id = criar(agua(1000).build());

        editar(id, agua(1500).build());
        editar(id, agua(1000).build());

        assertTrue(configPendenteRepository.findById(id).isEmpty());
        assertEquals(1, subAtividadeRepository.findAllByHabitoIdOrderByOrdem(id).size());
    }

    @Test
    void edicaoInvalida_eRecusadaNaHora_naoAmanha() {
        final var id = criar(agua(1000).build());

        final var tetoMenor = put("/api/habits/" + id, agua(1000).meta_maxima(500).build(), MessageResponseDTO.class);
        final var semDia = put("/api/habits/" + id, agua(1000).frequencia_semanal("0000000").build(),
                MessageResponseDTO.class);
        final var tipoErrado = put("/api/habits/" + id, agua(1000).tipo_medida("TEMPO").build(),
                MessageResponseDTO.class);

        assertEquals(400, tetoMenor.getStatusCode().value());
        assertEquals(400, semDia.getStatusCode().value());
        assertEquals(400, tipoErrado.getStatusCode().value());
        assertTrue(configPendenteRepository.findById(id).isEmpty());
    }

    @Test
    void excluirHabitoComPendencia_funciona() {
        final var id = criar(agua(1000).build());
        editar(id, agua(1500).build());

        assertEquals(200, delete("/api/habits/" + id, Object.class).getStatusCode().value());
        assertTrue(get("/api/dashboard", DashboardResponseDTO.class).getBody().habits().isEmpty());
    }
}
