package com.rodrigo.backend2java.integration;

import java.time.LocalTime;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;

import com.rodrigo.backend2java.BaseAPIIntegracaoTest;
import com.rodrigo.backend2java.habito.HabitoRequestDTO;
import com.rodrigo.backend2java.habito.HabitoRequestDTO.OcorrenciaRequestDTO;
import com.rodrigo.backend2java.habito.DashboardResponseDTO;
import com.rodrigo.backend2java.habito.HabitoResponseDTO;
import com.rodrigo.backend2java.infra.exception.MessageResponseDTO;
import com.rodrigo.backend2java.habito.HabitoRepository;
import com.rodrigo.backend2java.habito.SubAtividadeRepository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class HabitoIntegracaoTest extends BaseAPIIntegracaoTest {

    @Autowired
    private HabitoRepository habitoRepository;

    @Autowired
    private SubAtividadeRepository subAtividadeRepository;

    private HabitoResponseDTO criarHabitoUmaVezAoDia(final String titulo) {
        final var request = HabitoRequestDTO.builder()
                .titulo(titulo)
                .categoria("AGUA")
                .meta_base(2000)
                .tipo_medida("QUANTIDADE")
                .modalidade("DIARIA")
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
                .modalidade("DIARIA")
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

        // §5.1: o limite de RF03 é regra de negócio (422), não erro de validação (400).
        assertEquals(422, terceiro.getStatusCode().value());
        assertEquals(2, habitoRepository.findAllByUsuarioIdAndAtivoTrue(idUsuarioTeste).size());
    }

    @Test
    void atualizarHabito_persisteNovosValores() {
        final var criado = criarHabitoUmaVezAoDia("Título original");

        final var atualizacao = HabitoRequestDTO.builder()
                .titulo("Título editado")
                .categoria("AGUA")
                .meta_base(3000)
                .tipo_medida("QUANTIDADE")
                .modalidade("DIARIA")
                .meta_frequencia_diaria(1)
                .horario_agendado(LocalTime.of(9, 0))
                .build();
        final var resposta = put("/api/habits/" + criado.id(), atualizacao, Object.class);

        assertEquals(HttpStatus.OK, resposta.getStatusCode());
        final var noBanco = habitoRepository.findById(criado.id()).orElseThrow();
        assertEquals("Título editado", noBanco.getTitulo());
        assertEquals(3000, noBanco.getMetaBase());
    }

    @Test
    void deletarHabito_arquivaSemRemoverDoBanco() {
        final var criado = criarHabitoUmaVezAoDia("Para arquivar");

        final var resposta = delete("/api/habits/" + criado.id(), Object.class);

        assertEquals(HttpStatus.OK, resposta.getStatusCode());
        final var noBanco = habitoRepository.findById(criado.id()).orElseThrow();
        assertFalse(noBanco.getAtivo());
        assertTrue(habitoRepository.findAllByUsuarioIdAndAtivoTrue(idUsuarioTeste).isEmpty());
    }
}
