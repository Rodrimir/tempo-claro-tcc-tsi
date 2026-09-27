package com.rodrigo.backend2java.habito;

import java.time.LocalTime;

import org.hibernate.SessionFactory;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import com.rodrigo.backend2java.BaseAPIIntegracaoTest;
import jakarta.persistence.EntityManagerFactory;

import static org.junit.jupiter.api.Assertions.assertEquals;
import com.rodrigo.backend2java.habito.model.HabitoRequestDTO;
import com.rodrigo.backend2java.habito.model.HabitoResponseDTO;
import com.rodrigo.backend2java.habito.model.DashboardResponseDTO;

class HabitoDashboardQueryCountTest extends BaseAPIIntegracaoTest {

    private static final long QUERIES_FIXAS_DO_DASHBOARD = 6;

    @Autowired
    private EntityManagerFactory entityManagerFactory;

    private void criarHabito(final String titulo) {
        final var request = HabitoRequestDTO.builder()
                .titulo(titulo)
                .categoria("AGUA")
                .meta_base(2000)
                .tipo_medida("QUANTIDADE")
                .meta_frequencia_diaria(1)
                .horario_agendado(LocalTime.of(8, 0))
                .build();
        post("/api/habits", request, HabitoResponseDTO.class);
    }

    private long contarQueriesDoDashboard() {
        final var statistics = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
        statistics.clear();
        get("/api/dashboard", DashboardResponseDTO.class);
        return statistics.getPrepareStatementCount();
    }

    @Test
    void dashboard_comUmHabito_executaNumeroFixoDeQueries() {
        criarHabito("Hábito único");

        assertEquals(QUERIES_FIXAS_DO_DASHBOARD, contarQueriesDoDashboard());
    }

    @Test
    void dashboard_comDoisHabitos_executaOMesmoNumeroDeQueries() {
        criarHabito("Hábito A");
        criarHabito("Hábito B");

        assertEquals(QUERIES_FIXAS_DO_DASHBOARD, contarQueriesDoDashboard(),
                "o custo do dashboard não pode voltar a crescer com o número de hábitos");
    }
}
