package com.rodrigo.backend2java.repository;
import java.util.UUID;
import java.util.List;
import java.util.Optional;
import java.time.LocalTime;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import org.springframework.jdbc.core.JdbcTemplate;
import com.rodrigo.backend2java.model.SubAtividade;

// @audit-ok [Schema v2.1, tabela sub_atividades — repositório criado na
// E0.5.3. Consumido pela primeira vez na E0.5.5 (HabitoService.criarHabito /
// atualizarHabito): findAllByHabitoId e a agregação de meta_frequencia_diaria
// (ver vw_habito_hoje) seguem para a E1.1.]
@Repository
@RequiredArgsConstructor
public class SubAtividadeRepository {

        private static final String FIND_ALL_BY_HABITO_ID = "SELECT * FROM sub_atividades WHERE sub_habito_id = ? ORDER BY sub_ordem";

        private static final String FIND_BY_ID = "SELECT * FROM sub_atividades WHERE sub_id = ?";

        private static final String INSERT_SUB_ATIVIDADE = "INSERT INTO sub_atividades (sub_id, sub_habito_id, sub_ordem, sub_horario_inicio, sub_horario_fim, sub_alvo) "
                        +
                        "VALUES (?, ?, ?, ?, ?, ?)";

        // @audit-ok [E0.5.5 — usado por HabitoService.atualizarHabito para recalcular
        // as sub_atividades do zero a cada edição.]
        private static final String DELETE_ALL_BY_HABITO_ID = "DELETE FROM sub_atividades WHERE sub_habito_id = ?";

        private final JdbcTemplate jdbcTemplate;

        private final RowMapper<SubAtividade> rowMapper = (rs, rowNum) -> SubAtividade.builder()
                        .id(rs.getObject("sub_id", UUID.class))
                        .habitoId(rs.getObject("sub_habito_id", UUID.class))
                        .ordem(rs.getInt("sub_ordem"))
                        .horarioInicio(rs.getObject("sub_horario_inicio", LocalTime.class))
                        .horarioFim(rs.getObject("sub_horario_fim", LocalTime.class))
                        .alvo(rs.getInt("sub_alvo"))
                        .build();

        public List<SubAtividade> findAllByHabitoId(UUID habitoId) {
                return jdbcTemplate.query(FIND_ALL_BY_HABITO_ID, rowMapper, habitoId);
        }

        public Optional<SubAtividade> findById(UUID id) {
                return jdbcTemplate.query(FIND_BY_ID, rowMapper, id)
                                .stream()
                                .findFirst();
        }

        public void save(SubAtividade subAtividade) {
                jdbcTemplate.update(INSERT_SUB_ATIVIDADE,
                                subAtividade.getId() != null ? subAtividade.getId() : UUID.randomUUID(),
                                subAtividade.getHabitoId(),
                                subAtividade.getOrdem(),
                                subAtividade.getHorarioInicio(),
                                subAtividade.getHorarioFim(),
                                subAtividade.getAlvo());
        }

        public void deleteAllByHabitoId(UUID habitoId) {
                jdbcTemplate.update(DELETE_ALL_BY_HABITO_ID, habitoId);
        }
}
