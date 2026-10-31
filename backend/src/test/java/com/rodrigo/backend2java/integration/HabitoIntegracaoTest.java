package com.rodrigo.backend2java.integration;

import java.time.LocalTime;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;

import com.rodrigo.backend2java.BaseAPIIntegracaoTest;
import com.rodrigo.backend2java.habito.model.HabitoRequestDTO;
import com.rodrigo.backend2java.habito.model.HabitoRequestDTO.OcorrenciaRequestDTO;
import com.rodrigo.backend2java.habito.model.DashboardResponseDTO;
import com.rodrigo.backend2java.habito.model.HabitoResponseDTO;
import com.rodrigo.backend2java.infra.exception.MessageResponseDTO;
import com.rodrigo.backend2java.habito.HabitoRepository;
import com.rodrigo.backend2java.habito.SubAtividadeRepository;
import com.rodrigo.backend2java.habito.ConfigPendenteRepository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class HabitoIntegracaoTest extends BaseAPIIntegracaoTest {

    @Autowired
    private HabitoRepository habitoRepository;

    @Autowired
    private SubAtividadeRepository subAtividadeRepository;

    @Autowired
    private ConfigPendenteRepository configPendenteRepository;

    private HabitoResponseDTO criarHabitoUmaVezAoDia(final String titulo) {
        final var request = HabitoRequestDTO.builder()
                .titulo(titulo)
                .categoria("AGUA")
                .meta_base(2000)
                .tipo_medida("QUANTIDADE")
                .meta_frequencia_diaria(1)
                .horario_agendado(LocalTime.of(8, 0))
                .build();
        return post("/api/habits", request, HabitoResponseDTO.class).getBody();
    }

    @Test
    void criarHabito_semOcorrencias_geraUmaSubAtividade() {
        final var criado = criarHabitoUmaVezAoDia("Beber água");

        assertEquals(1, subAtividadeRepository.findAllByHabitoIdOrderByOrdem(criado.id()).size());
        assertEquals(2000, subAtividadeRepository.findAllByHabitoIdOrderByOrdem(criado.id()).get(0).getAlvo());
        assertTrue(habitoRepository.findById(criado.id()).orElseThrow().getAtivo());
    }

    @Test
    void criarHabito_comTresOcorrencias_rateiaAMetaEntreElas() {
        final var request = HabitoRequestDTO.builder()
                .titulo("Estudar")
                .categoria("ESTUDO")
                .meta_base(2100)
                .tipo_medida("TEMPO")
                .meta_frequencia_diaria(3)
                .frequencia_semanal("1111100")
                .ocorrencias(List.of(
                        new OcorrenciaRequestDTO(LocalTime.of(8, 0), LocalTime.of(9, 0)),
                        new OcorrenciaRequestDTO(LocalTime.of(13, 0), LocalTime.of(14, 0)),
                        new OcorrenciaRequestDTO(LocalTime.of(19, 0), LocalTime.of(20, 0))))
                .build();

        final var criado = post("/api/habits", request, HabitoResponseDTO.class).getBody();

        final var subAtividades = subAtividadeRepository.findAllByHabitoIdOrderByOrdem(criado.id());
        assertEquals(3, subAtividades.size());
        subAtividades.forEach(sub -> assertEquals(700, sub.getAlvo()));
    }

    @Test
    void listarDashboard_devolveHabitosAtivosDoUsuarioComLimite() {
        criarHabitoUmaVezAoDia("Hábito A");

        final var dashboard = get("/api/dashboard", DashboardResponseDTO.class).getBody();

        assertEquals(1, dashboard.habits().size());
        assertEquals(2, dashboard.limite_habitos_ativos());
    }

    @Test
    void criarTerceiroHabito_excedeLimiteDeDois_retorna422() {
        criarHabitoUmaVezAoDia("Hábito 1");
        criarHabitoUmaVezAoDia("Hábito 2");

        final var terceiro = post("/api/habits", HabitoRequestDTO.builder()
                .titulo("Hábito 3").categoria("EXERCICIO").meta_base(10)
                .tipo_medida("TEMPO").meta_frequencia_diaria(1)
                .horario_agendado(LocalTime.of(7, 0)).build(), MessageResponseDTO.class);

        assertEquals(422, terceiro.getStatusCode().value());
        assertEquals(2, habitoRepository.findAllByUsuarioIdAndAtivoTrue(idUsuarioTeste).size());
    }

    // Desde 16/10/2026 a edição da configuração de execução só vale no dia seguinte (o título muda
    // na hora). O teste confere a pendência e depois simula a virada do dia.
    @Test
    void atualizarHabito_persisteNovosValores() {
        final var criado = criarHabitoUmaVezAoDia("Título original");

        final var atualizacao = HabitoRequestDTO.builder()
                .titulo("Título editado")
                .categoria("AGUA")
                .meta_base(3000)
                .tipo_medida("QUANTIDADE")
                .meta_frequencia_diaria(1)
                .horario_agendado(LocalTime.of(9, 0))
                .build();
        final var resposta = put("/api/habits/" + criado.id(), atualizacao, Object.class);

        assertEquals(HttpStatus.OK, resposta.getStatusCode());
        final var noBanco = habitoRepository.findById(criado.id()).orElseThrow();
        assertEquals("Título editado", noBanco.getTitulo());
        assertEquals(2000, noBanco.getMetaBase(), "a meta nova só vale amanhã");
        final var pendente = configPendenteRepository.findById(criado.id()).orElseThrow();
        assertEquals(3000, pendente.getMetaBase());

        pendente.setVigenteEm(pendente.getVigenteEm().minusDays(1));
        configPendenteRepository.save(pendente);
        get("/api/dashboard", Object.class);

        assertEquals(3000, habitoRepository.findById(criado.id()).orElseThrow().getMetaBase());
        assertTrue(configPendenteRepository.findById(criado.id()).isEmpty());
    }

    @Test
    void deletarHabito_excluiSemRemoverDoBanco() {
        final var criado = criarHabitoUmaVezAoDia("Para excluir");

        final var resposta = delete("/api/habits/" + criado.id(), Object.class);

        assertEquals(HttpStatus.OK, resposta.getStatusCode());
        final var noBanco = habitoRepository.findById(criado.id()).orElseThrow();
        assertFalse(noBanco.getAtivo());
        assertTrue(habitoRepository.findAllByUsuarioIdAndAtivoTrue(idUsuarioTeste).isEmpty());
    }
}
