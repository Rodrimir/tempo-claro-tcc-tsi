package com.rodrigo.backend2java.habito;

import java.time.LocalTime;

import org.hibernate.SessionFactory;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import com.rodrigo.backend2java.BaseAPIIntegracaoTest;
import jakarta.persistence.EntityManagerFactory;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * O dashboard passou a custar um número FIXO de consultas, e este teste é o que
 * impede a regressão.
 *
 * <p>Antes da v3.0 eram 3 consultas fixas + 2 por hábito: {@code listarDashboard}
 * chamava {@code buscarDetalhadoPorId} dentro do laço, e cada chamada lia a view
 * {@code vw_habito_hoje} e as sub_atividades daquele hábito. Com a view removida, o
 * service carrega status e ocorrências de todos os hábitos de uma vez — 6 consultas,
 * tenha o usuário um hábito ou dois (e o teto são dois, por RF03).
 */
class HabitoDashboardQueryCountTest extends BaseAPIIntegracaoTest {

    /**
     * Checagem do token, busca do usuário, listagem dos hábitos, status de todos,
     * ocorrências de todos e quais sub_atividades já foram cumpridas hoje (para o
     * status ATIVA/FEITO/FALHOU/PENDENTE por ocorrência) — também em lote, não por
     * hábito, pelo mesmo motivo.
     */
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
