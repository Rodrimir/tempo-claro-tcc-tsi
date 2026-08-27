package com.rodrigo.backend2java.repository;
import java.util.UUID;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import org.springframework.jdbc.core.JdbcTemplate;
import com.rodrigo.backend2java.model.CalibracaoResposta;

// @audit-ok [Schema v2.1, tabela calibracao_respostas — repositório criado na
// E0.5.3 só para existir (D4: trabalho futuro). Sem uso em nenhum service.]
@Repository
@RequiredArgsConstructor
public class CalibracaoRespostaRepository {

        private static final String FIND_ALL_BY_CALIBRACAO_ID = "SELECT * FROM calibracao_respostas WHERE cal_calibracao_id = ?";

        private static final String INSERT_RESPOSTA = "INSERT INTO calibracao_respostas (cal_id, cal_calibracao_id, cal_pergunta_codigo, cal_resposta) "
                        +
                        "VALUES (?, ?, ?, ?)";

        private final JdbcTemplate jdbcTemplate;

        private final RowMapper<CalibracaoResposta> rowMapper = (rs, rowNum) -> CalibracaoResposta.builder()
                        .id(rs.getObject("cal_id", UUID.class))
                        .calibracaoId(rs.getObject("cal_calibracao_id", UUID.class))
                        .perguntaCodigo(rs.getString("cal_pergunta_codigo"))
                        .resposta(rs.getString("cal_resposta"))
                        .build();

        public List<CalibracaoResposta> findAllByCalibracaoId(UUID calibracaoId) {
                return jdbcTemplate.query(FIND_ALL_BY_CALIBRACAO_ID, rowMapper, calibracaoId);
        }

        public void save(CalibracaoResposta resposta) {
                jdbcTemplate.update(INSERT_RESPOSTA,
                                resposta.getId() != null ? resposta.getId() : UUID.randomUUID(),
                                resposta.getCalibracaoId(),
                                resposta.getPerguntaCodigo(),
                                resposta.getResposta());
        }
}
