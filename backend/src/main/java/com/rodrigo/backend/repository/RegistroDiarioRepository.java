package com.rodrigo.backend.repository;

import java.util.UUID;
import java.util.List;
import java.util.Optional;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import org.springframework.jdbc.core.JdbcTemplate;
import com.rodrigo.backend.model.RegistroDiario;

// @audit-ok [Execução(3) / Dashboard(3) — fechamento diário do hábito; UNIQUE (habito_id, data_execucao) garante um registro por dia]

@Repository
@RequiredArgsConstructor
public class RegistroDiarioRepository {

    private static final String FIND_BY_HABITO_AND_DATA =
            "SELECT * FROM registros_diarios WHERE habito_id = ? AND data_execucao = ?";

    private static final String FIND_ALL_BY_HABITO_ID =
            "SELECT * FROM registros_diarios WHERE habito_id = ? ORDER BY data_execucao DESC";

    private static final String FIND_BY_HABITO_FROM_DATA =
            "SELECT * FROM registros_diarios WHERE habito_id = ? AND data_execucao >= ? ORDER BY data_execucao ASC";

    private static final String UPSERT =
            "INSERT INTO registros_diarios " +
            "(id, habito_id, data_execucao, valor_total_dia, meta_do_dia, status, hora_conclusao, protegido_por_escudo) " +
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?) " +
            "ON CONFLICT (habito_id, data_execucao) DO UPDATE SET " +
            "valor_total_dia = EXCLUDED.valor_total_dia, " +
            "status = EXCLUDED.status, " +
            "hora_conclusao = EXCLUDED.hora_conclusao, " +
            "protegido_por_escudo = EXCLUDED.protegido_por_escudo";

    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<RegistroDiario> rowMapper = (rs, rowNum) -> RegistroDiario.builder()
            .id(rs.getObject("id", UUID.class))
            .habitoId(rs.getObject("habito_id", UUID.class))
            .dataExecucao(rs.getObject("data_execucao", LocalDate.class))
            .valorTotalDia(rs.getInt("valor_total_dia"))
            .metaDoDia(rs.getInt("meta_do_dia"))
            .status(rs.getString("status"))
            .horaConclusao(rs.getObject("hora_conclusao", OffsetDateTime.class))
            .protegidoPorEscudo(rs.getBoolean("protegido_por_escudo"))
            .sentimentoPosConclusao(rs.getString("sentimento_pos_conclusao"))
            .build();

    // @audit-ok [Execução(3) — busca o registro do dia atual para acumular valor parcial antes de fechar]
    public Optional<RegistroDiario> findByHabitoIdAndData(UUID habitoId, LocalDate data) {
        return jdbcTemplate.query(FIND_BY_HABITO_AND_DATA, rowMapper, habitoId, data)
                .stream().findFirst();
    }

    // @audit-ok [Dashboard(3) — lista todos os registros em ordem desc para calcular streak em memória no service]
    public List<RegistroDiario> findAllByHabitoId(UUID habitoId) {
        return jdbcTemplate.query(FIND_ALL_BY_HABITO_ID, rowMapper, habitoId);
    }

    // @audit-ok [Estatísticas(3) — busca registros a partir de uma data; usado para montar os 7 dias do stats semanal]
    public List<RegistroDiario> findByHabitoIdAndDataFrom(UUID habitoId, LocalDate from) {
        return jdbcTemplate.query(FIND_BY_HABITO_FROM_DATA, rowMapper, habitoId, from);
    }

    // @audit-ok [Execução(3) — UPSERT: cria ou atualiza o fechamento do dia; ON CONFLICT garante idempotência]
    public void upsert(RegistroDiario registro) {
        jdbcTemplate.update(UPSERT,
                registro.getId() != null ? registro.getId() : UUID.randomUUID(),
                registro.getHabitoId(),
                registro.getDataExecucao(),
                registro.getValorTotalDia(),
                registro.getMetaDoDia(),
                registro.getStatus(),
                registro.getHoraConclusao(),
                registro.getProtegidoPorEscudo());
    }
}
