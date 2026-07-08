package com.rodrigo.backend.repository;

import java.util.UUID;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.jdbc.core.JdbcTemplate;

// @audit-ok [Criar Hábito(3) / Dashboard(3) — repositório da frequência semanal do hábito (0=Dom … 6=Sáb)]

@Repository
@RequiredArgsConstructor
public class HabitoDiaSemanaRepository {

    private static final String FIND_BY_HABITO_ID =
            "SELECT dia_semana FROM habito_dias_semana WHERE habito_id = ? ORDER BY dia_semana";

    private static final String INSERT =
            "INSERT INTO habito_dias_semana (habito_id, dia_semana) VALUES (?, ?)";

    private static final String DELETE_BY_HABITO_ID =
            "DELETE FROM habito_dias_semana WHERE habito_id = ?";

    private final JdbcTemplate jdbcTemplate;

    // @audit-ok [Dashboard(3) — retorna lista de dias da semana configurados para o hábito]
    public List<Integer> findByHabitoId(UUID habitoId) {
        return jdbcTemplate.queryForList(FIND_BY_HABITO_ID, Integer.class, habitoId);
    }

    // @audit-ok [Criar Hábito(3) — insere cada dia da semana em linha separada (PK composta)]
    public void saveAll(UUID habitoId, List<Integer> dias) {
        for (Integer dia : dias) {
            jdbcTemplate.update(INSERT, habitoId, dia);
        }
    }

    // @audit-ok [Atualizar Hábito(3) — deleta todos os dias do hábito para re-inserção]
    public void deleteByHabitoId(UUID habitoId) {
        jdbcTemplate.update(DELETE_BY_HABITO_ID, habitoId);
    }
}
