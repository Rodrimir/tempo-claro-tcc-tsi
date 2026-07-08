package com.rodrigo.backend.repository;

import java.util.UUID;
import java.util.List;
import java.util.Optional;
import java.time.LocalTime;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import org.springframework.jdbc.core.JdbcTemplate;
import com.rodrigo.backend.model.SubAtividade;

// @audit-ok [Criar Hábito(3) / Dashboard(3) — repositório de sub-atividades; ordenado por 'ordem' para manter sequência]

@Repository
@RequiredArgsConstructor
public class SubAtividadeRepository {

    private static final String FIND_BY_HABITO_ID =
            "SELECT * FROM sub_atividades WHERE habito_id = ? ORDER BY ordem";

    private static final String FIND_BY_ID =
            "SELECT * FROM sub_atividades WHERE id = ?";

    private static final String INSERT =
            "INSERT INTO sub_atividades (id, habito_id, ordem, alvo_parcial, horario_inicio, horario_fim) " +
            "VALUES (?, ?, ?, ?, ?, ?)";

    private static final String DELETE_BY_HABITO_ID =
            "DELETE FROM sub_atividades WHERE habito_id = ?";

    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<SubAtividade> rowMapper = (rs, rowNum) -> SubAtividade.builder()
            .id(rs.getObject("id", UUID.class))
            .habitoId(rs.getObject("habito_id", UUID.class))
            .ordem(rs.getInt("ordem"))
            .alvoParcial(rs.getInt("alvo_parcial"))
            .horarioInicio(rs.getObject("horario_inicio", LocalTime.class))
            .horarioFim(rs.getObject("horario_fim", LocalTime.class))
            .build();

    // @audit-ok [Dashboard(3) — retorna todas as sub-atividades do hábito em ordem crescente]
    public List<SubAtividade> findByHabitoId(UUID habitoId) {
        return jdbcTemplate.query(FIND_BY_HABITO_ID, rowMapper, habitoId);
    }

    // @audit-ok [Execução(3) — busca uma sub-atividade por id para obter alvo_parcial no crédito proporcional (regra 3.8)]
    public Optional<SubAtividade> findById(UUID id) {
        return jdbcTemplate.query(FIND_BY_ID, rowMapper, id).stream().findFirst();
    }

    // @audit-ok [Criar Hábito(3) — INSERT de uma sub-atividade; UUID gerado pelo service]
    public void save(SubAtividade subAtividade) {
        jdbcTemplate.update(INSERT,
                subAtividade.getId() != null ? subAtividade.getId() : UUID.randomUUID(),
                subAtividade.getHabitoId(),
                subAtividade.getOrdem(),
                subAtividade.getAlvoParcial(),
                subAtividade.getHorarioInicio(),
                subAtividade.getHorarioFim());
    }

    // @audit-ok [Atualizar Hábito(3) — deleta todas as sub-atividades do hábito para re-inserção]
    public void deleteByHabitoId(UUID habitoId) {
        jdbcTemplate.update(DELETE_BY_HABITO_ID, habitoId);
    }
}