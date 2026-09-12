package com.rodrigo.backend2java.integration;

import java.util.List;
import java.time.LocalTime;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;

import com.rodrigo.backend2java.BaseAPIIntegracaoTest;
import com.rodrigo.backend2java.calibracao.CalibracaoRepository;
import com.rodrigo.backend2java.calibracao.CalibracaoRequestDTO;
import com.rodrigo.backend2java.calibracao.CalibracaoRequestDTO.RespostaDTO;
import com.rodrigo.backend2java.calibracao.CalibracaoResponseDTO;
import com.rodrigo.backend2java.calibracao.QuestionarioResponseDTO;
import com.rodrigo.backend2java.habito.HabitoRequestDTO;
import com.rodrigo.backend2java.habito.HabitoResponseDTO;
import com.rodrigo.backend2java.infra.exception.MessageResponseDTO;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Calibração assistida de metas (RF20/RNF04).
 */
class CalibracaoIntegracaoTest extends BaseAPIIntegracaoTest {

    @Autowired
    private CalibracaoRepository calibracaoRepository;

    private CalibracaoResponseDTO calibrar(final String categoria, final List<RespostaDTO> respostas) {
        return post("/api/calibration", new CalibracaoRequestDTO(categoria, respostas),
                CalibracaoResponseDTO.class).getBody();
    }

    @Test
    void questionario_devolveAsPerguntasDaCategoriaComSeusTipos() {
        final var resposta = get("/api/calibration/questions?categoria=EXERCICIO",
                QuestionarioResponseDTO.class);

        assertEquals(HttpStatus.OK, resposta.getStatusCode());
        final var questionario = resposta.getBody();
        assertEquals("TEMPO", questionario.tipo_medida());
        assertEquals("min", questionario.unidade());

        final var codigos = questionario.perguntas().stream()
                .map(QuestionarioResponseDTO.PerguntaDTO::codigo).toList();
        assertTrue(codigos.containsAll(List.of("DIAS_SEMANA", "VEZES_AO_DIA", "HORARIOS", "RITMO")));

        // O app desenha pelo tipo, não pelo código: todo tipo precisa vir preenchido.
        questionario.perguntas().forEach(pergunta -> assertNotNull(pergunta.tipo()));
    }

    @Test
    void categoriaSemCatalogo_retorna400() {
        final var resposta = get("/api/calibration/questions?categoria=MEDITACAO",
                MessageResponseDTO.class);

        assertEquals(HttpStatus.BAD_REQUEST, resposta.getStatusCode());
    }

    /** Quem nunca praticou e tem pouco tempo começa no degrau mais baixo. */
    @Test
    void iniciante_recebeMetaMinima() {
        final var sugestao = calibrar("EXERCICIO", List.of(
                new RespostaDTO("EXPERIENCIA_PREVIA", "NUNCA"),
                new RespostaDTO("DESEJO", "FORCANDO"),
                new RespostaDTO("TEMPO_DISPONIVEL", "ATE_5"),
                new RespostaDTO("DIAS_SEMANA", "0101010"),
                new RespostaDTO("VEZES_AO_DIA", "1"),
                new RespostaDTO("HORARIOS", "07:00"),
                new RespostaDTO("RITMO", "DEVAGAR"))).sugestao();

        assertEquals(1, sugestao.meta_base());
        assertEquals(1, sugestao.meta_frequencia_diaria());
        assertEquals("0101010", sugestao.frequencia_semanal());
        assertEquals(1, sugestao.incremento());
        assertEquals(14, sugestao.dias_incremento());
    }

    /**
     * A trava do teto: mesmo pontuando alto em tudo o mais, quem declarou 10
     * minutos disponíveis não recebe sugestão de 30 (3ª lei de Clear).
     */
    @Test
    void tetoDeclaradoPelaResposta_limitaAMetaSugerida() {
        final var sugestao = calibrar("EXERCICIO", List.of(
                new RespostaDTO("EXPERIENCIA_PREVIA", "REGULAR"),
                new RespostaDTO("DESEJO", "AMO"),
                new RespostaDTO("TEMPO_DISPONIVEL", "ATE_10"),
                new RespostaDTO("DIAS_SEMANA", "1111111"),
                new RespostaDTO("VEZES_AO_DIA", "1"),
                new RespostaDTO("HORARIOS", "06:00"),
                new RespostaDTO("RITMO", "RAPIDO"))).sugestao();

        assertEquals(10, sugestao.meta_base(), "a resposta de tempo disponível é o teto");
        assertEquals(40, sugestao.meta_maxima());
    }

    @Test
    void agua_reparteAMetaEntreOsMomentosDoDia() {
        final var resposta = calibrar("AGUA", List.of(
                new RespostaDTO("CONSUMO_ATUAL", "BASTANTE"),
                new RespostaDTO("LEMBRA_SOZINHO", "QUASE_SEMPRE"),
                new RespostaDTO("GARRAFA_POR_PERTO", "SEMPRE"),
                new RespostaDTO("DIAS_SEMANA", "1111111"),
                new RespostaDTO("VEZES_AO_DIA", "3"),
                new RespostaDTO("HORARIOS", "08:00,13:00,19:00"),
                new RespostaDTO("RITMO", "EQUILIBRADO")));

        final var sugestao = resposta.sugestao();
        assertEquals(2100, sugestao.meta_base());
        assertEquals(3, sugestao.ocorrencias().size());
        assertEquals(2100, sugestao.ocorrencias().stream().mapToInt(o -> o.alvo()).sum());
        assertEquals(LocalTime.of(13, 0), sugestao.ocorrencias().get(1).horario_inicio());
        assertNotNull(resposta.explicacao());
    }

    @Test
    void diasDaSemanaInvalidos_retorna400() {
        final var resposta = post("/api/calibration", new CalibracaoRequestDTO("AGUA", List.of(
                new RespostaDTO("CONSUMO_ATUAL", "BASTANTE"),
                new RespostaDTO("DIAS_SEMANA", "0000000"),
                new RespostaDTO("VEZES_AO_DIA", "1"),
                new RespostaDTO("HORARIOS", "08:00"),
                new RespostaDTO("RITMO", "EQUILIBRADO"))), MessageResponseDTO.class);

        assertEquals(HttpStatus.BAD_REQUEST, resposta.getStatusCode());
    }

    @Test
    void habitoCriadoComCalibracaoId_marcaASugestaoComoAceitaEVinculaAoHabito() {
        final var calibracao = calibrar("ESTUDO", List.of(
                new RespostaDTO("ROTINA_ATUAL", "ALGUMAS_VEZES"),
                new RespostaDTO("FOCO", "UNS_25"),
                new RespostaDTO("MOTIVACAO", "CURIOSIDADE"),
                new RespostaDTO("DIAS_SEMANA", "0111110"),
                new RespostaDTO("VEZES_AO_DIA", "1"),
                new RespostaDTO("HORARIOS", "20:00"),
                new RespostaDTO("RITMO", "EQUILIBRADO")));

        final var criado = post("/api/habits", HabitoRequestDTO.builder()
                .titulo("Estudar")
                .categoria("ESTUDO")
                .tipo_medida("TEMPO")
                .meta_base(calibracao.sugestao().meta_base())
                .meta_frequencia_diaria(calibracao.sugestao().meta_frequencia_diaria())
                .horario_agendado(LocalTime.of(20, 0))
                .frequencia_semanal(calibracao.sugestao().frequencia_semanal())
                .incremento(calibracao.sugestao().incremento())
                .dias_incremento(calibracao.sugestao().dias_incremento())
                .calibracao_id(calibracao.calibracao_id())
                .build(), HabitoResponseDTO.class);

        assertEquals(HttpStatus.CREATED, criado.getStatusCode());

        final var persistida = calibracaoRepository.findById(calibracao.calibracao_id()).orElseThrow();
        assertTrue(persistida.getAceita());
        assertEquals(criado.getBody().id(), persistida.getHabitoId());
        assertEquals(idUsuarioTeste, persistida.getUsuarioId());
    }
}
