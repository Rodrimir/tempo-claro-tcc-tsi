package com.rodrigo.backend.repository;

import java.util.UUID;
import java.util.List;
import java.util.Optional;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import org.springframework.jdbc.core.JdbcTemplate;
import com.rodrigo.backend.model.SubAtividadeStatus;

// @audit-ok [Execução(3) — estado diário das sub-atividades; regra 3.8: verifica executada e moedas_creditadas antes de creditar]

@Repository
@RequiredArgsConstructor
public class SubAtividadeStatusRepository {

    private static final String FIND_BY_SUB_ATIVIDADE_AND_DATA =
            "SELECT * FROM sub_atividade_status WHERE sub_atividade_id = ? AND data_execucao = ?";

    private static final String FIND_BY_HABITO_AND_DATA =
            "SELECT s.* FROM sub_atividade_status s " +
            "JOIN sub_atividades sa ON sa.id = s.sub_atividade_id " +
            "WHERE sa.habito_id = ? AND s.data_execucao = ?";

    private static final String UPSERT =
            "INSERT INTO sub_atividade_status " +
            "(id, sub_atividade_id, data_execucao, valor_realizado, executada, moedas_creditadas) " +
            "VALUES (?, ?, ?, ?, ?, ?) " +
            "ON CONFLICT (sub_atividade_id, data_execucao) DO UPDATE SET " +
            "valor_realizado = EXCLUDED.valor_realizado, " +
            "executada = EXCLUDED.executada, " +
            "moedas_creditadas = EXCLUDED.moedas_creditadas";

    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<SubAtividadeStatus> rowMapper = (rs, rowNum) -> SubAtividadeStatus.builder()
            .id(rs.getObject("id", UUID.class))
            .subAtividadeId(rs.getObject("sub_atividade_id", UUID.class))
            .dataExecucao(rs.getObject("data_execucao", LocalDate.class))
            .valorRealizado(rs.getInt("valor_realizado"))
            .executada(rs.getBoolean("executada"))
            .moedasCreditadas(rs.getBoolean("moedas_creditadas"))
            .build();

    // @audit-ok [Execução(3) — busca o status da sub-atividade no dia para verificar se já foi creditada (regra 3.8)]
    public Optional<SubAtividadeStatus> findBySubAtividadeIdAndData(UUID subAtividadeId, LocalDate data) {
        return jdbcTemplate.query(FIND_BY_SUB_ATIVIDADE_AND_DATA, rowMapper, subAtividadeId, data)
                .stream().findFirst();
    }

    // @audit-ok [Execução(3) — lista todos os status do hábito no dia via JOIN; verifica quais partes foram executadas]
    public List<SubAtividadeStatus> findByHabitoIdAndData(UUID habitoId, LocalDate data) {
        return jdbcTemplate.query(FIND_BY_HABITO_AND_DATA, rowMapper, habitoId, data);
    }

    // @audit-ok [Execução(3) — UPSERT: cria ou atualiza status da parte; ON CONFLICT garante um registro por dia por sub-atividade]
    public void upsert(SubAtividadeStatus status) {
        jdbcTemplate.update(UPSERT,
                status.getId() != null ? status.getId() : UUID.randomUUID(),
                status.getSubAtividadeId(),
                status.getDataExecucao(),
                status.getValorRealizado(),
                status.getExecutada(),
                status.getMoedasCreditadas());
    }
}
