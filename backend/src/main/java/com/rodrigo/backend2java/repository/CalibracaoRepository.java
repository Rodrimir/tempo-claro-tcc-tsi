package com.rodrigo.backend2java.repository;
import java.util.UUID;
import java.util.Optional;
import java.time.OffsetDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import org.springframework.jdbc.core.JdbcTemplate;
import com.rodrigo.backend2java.model.Calibracao;

// @audit-ok [Schema v2.1, tabela calibracoes — repositório criado na E0.5.3
// só para existir (D4: questionário "Medir Dificuldade" é trabalho futuro).
// Sem uso em nenhum service.]
@Repository
@RequiredArgsConstructor
public class CalibracaoRepository {

        private static final String FIND_BY_ID = "SELECT * FROM calibracoes WHERE cab_id = ?";

        private static final String INSERT_CALIBRACAO = "INSERT INTO calibracoes (cab_id, cab_habito_id, cab_meta_sugerida, cab_incremento_sugerido, cab_aceita, cab_criado_em) "
                        +
                        "VALUES (?, ?, ?, ?, ?, ?)";

        private final JdbcTemplate jdbcTemplate;

        private final RowMapper<Calibracao> rowMapper = (rs, rowNum) -> Calibracao.builder()
                        .id(rs.getObject("cab_id", UUID.class))
                        .habitoId(rs.getObject("cab_habito_id", UUID.class))
                        .metaSugerida(rs.getInt("cab_meta_sugerida"))
                        .incrementoSugerido(rs.getInt("cab_incremento_sugerido"))
                        .aceita(rs.getBoolean("cab_aceita"))
                        .criadoEm(rs.getObject("cab_criado_em", OffsetDateTime.class))
                        .build();

        public Optional<Calibracao> findById(UUID id) {
                return jdbcTemplate.query(FIND_BY_ID, rowMapper, id)
                                .stream()
                                .findFirst();
        }

        public void save(Calibracao calibracao) {
                jdbcTemplate.update(INSERT_CALIBRACAO,
                                calibracao.getId() != null ? calibracao.getId() : UUID.randomUUID(),
                                calibracao.getHabitoId(),
                                calibracao.getMetaSugerida(),
                                calibracao.getIncrementoSugerido(),
                                calibracao.getAceita(),
                                calibracao.getCriadoEm());
        }
}
