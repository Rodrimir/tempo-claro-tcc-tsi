package com.rodrigo.backend2java.integration;

import java.time.LocalTime;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import com.rodrigo.backend2java.BaseAPIIntegracaoTest;
import com.rodrigo.backend2java.execucao.StatusHabitoRepository;
import com.rodrigo.backend2java.habito.DashboardResponseDTO;
import com.rodrigo.backend2java.habito.HabitoRequestDTO;
import com.rodrigo.backend2java.habito.HabitoResponseDTO;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * PLANO_REESTRUTURACAO.md, H — escudo caiu de 1500 para 400 moedas, e todo
 * hábito novo já nasce com 3 (em vez de 0). O preço vem do dashboard
 * (custo_escudo), não de uma constante duplicada no app.
 */
class EscudoIntegracaoTest extends BaseAPIIntegracaoTest {

    @Autowired
    private StatusHabitoRepository statusHabitoRepository;

    private UUID criarHabito() {
        final var request = HabitoRequestDTO.builder()
                .titulo("Hábito de escudo")
                .categoria("AGUA")
                .meta_base(1000)
                .tipo_medida("QUANTIDADE")
                .meta_frequencia_diaria(1)
                .horario_agendado(LocalTime.of(8, 0))
                .frequencia_semanal("1111111")
                .build();
        return post("/api/habits", request, HabitoResponseDTO.class).getBody().id();
    }

    @Test
    void habitoNovo_nasceComTresEscudos() {
        final var request = HabitoRequestDTO.builder()
                .titulo("Hábito de escudo")
                .categoria("AGUA")
                .meta_base(1000)
                .tipo_medida("QUANTIDADE")
                .meta_frequencia_diaria(1)
                .horario_agendado(LocalTime.of(8, 0))
                .frequencia_semanal("1111111")
                .build();
        final var habito = post("/api/habits", request, HabitoResponseDTO.class).getBody();

        assertEquals(3, habito.bloqueios_acumulados());

        final var status = statusHabitoRepository.findById(habito.id()).orElseThrow();
        assertEquals(3, status.getBloqueiosAcumulados());
    }

    @Test
    void dashboard_expoeCustoDoEscudo() {
        criarHabito();

        final var dashboard = get("/api/dashboard", DashboardResponseDTO.class).getBody();

        assertEquals(400, dashboard.custo_escudo());
    }

    @Test
    void comprarEscudo_comSaldoSuficiente_debitaQuatrocentasMoedas() {
        final var habitoId = criarHabito();
        final var status = statusHabitoRepository.findById(habitoId).orElseThrow();
        status.setMoedasLocais(400);
        statusHabitoRepository.save(status);

        final var resposta = post("/api/habits/" + habitoId + "/shield", null, Object.class);

        assertEquals(200, resposta.getStatusCode().value());
        final var depois = statusHabitoRepository.findById(habitoId).orElseThrow();
        assertEquals(0, depois.getMoedasLocais());
        // Nasceu com 3 (H) + comprou 1 = 4.
        assertEquals(4, depois.getBloqueiosAcumulados());
    }

    @Test
    void comprarEscudo_comSaldoInsuficiente_recusaComQuatrocentosComoReferencia() {
        final var habitoId = criarHabito();
        final var status = statusHabitoRepository.findById(habitoId).orElseThrow();
        status.setMoedasLocais(399);
        statusHabitoRepository.save(status);

        final var resposta = post("/api/habits/" + habitoId + "/shield", null, Object.class);

        assertEquals(422, resposta.getStatusCode().value());
        final var depois = statusHabitoRepository.findById(habitoId).orElseThrow();
        assertEquals(399, depois.getMoedasLocais());
        assertEquals(3, depois.getBloqueiosAcumulados());
    }
}
