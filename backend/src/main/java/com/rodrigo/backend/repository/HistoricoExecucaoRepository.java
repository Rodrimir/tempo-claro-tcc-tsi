package com.rodrigo.backend.repository;

import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.jdbc.core.JdbcTemplate;
import com.rodrigo.backend.model.HistoricoExecucao;

// @audit-ok [Execução(3) — repositório de histórico de execuções; chave de idempotência via execution_token UNIQUE]

@Repository
@RequiredArgsConstructor
public class HistoricoExecucaoRepository {

    private static final String COUNT_BY_EXECUTION_TOKEN =
            "SELECT COUNT(1) FROM historico_execucoes WHERE execution_token = ?";

    private static final String COUNT_BY_TIPO_SUCESSO_AND_HABITO =
            "SELECT COUNT(1) FROM historico_execucoes WHERE habito_id = ? AND tipo_sucesso = ?";

    private static final String MAX_VALOR_BY_HABITO =
            "SELECT COALESCE(MAX(valor_realizado), 0) FROM historico_execucoes WHERE habito_id = ?";

    private static final String INSERT_HISTORICO =
            "INSERT INTO historico_execucoes " +
            "(id, habito_id, sub_atividade_id, execution_token, data_hora_execucao, " +
            "valor_realizado, moedas_ganhas, tipo_sucesso) " +
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

    private final JdbcTemplate jdbcTemplate;

    // @audit-ok [Execução(3) — COUNT por execution_token; retorna true se já foi processado (idempotência)]
    public boolean existsByExecutionToken(UUID executionToken) {
        Integer count = jdbcTemplate.queryForObject(COUNT_BY_EXECUTION_TOKEN, Integer.class, executionToken);
        return count != null && count > 0;
    }

    // @audit-ok [Estatísticas(3) — MAX(valor_realizado) por hábito; exibe o recorde de execução no stats semanal]
    public int findMaxValorByHabitoId(UUID habitoId) {
        Integer result = jdbcTemplate.queryForObject(MAX_VALOR_BY_HABITO, Integer.class, habitoId);
        return result != null ? result : 0;
    }

    // @audit-ok [Dashboard(3) — COUNT por tipo_sucesso e habito_id; calcula escudos consumidos via FAIL_BLOQUEIO]
    public int countByTipoSucessoAndHabitoId(UUID habitoId, String tipoSucesso) {
        Integer result = jdbcTemplate.queryForObject(COUNT_BY_TIPO_SUCESSO_AND_HABITO, Integer.class, habitoId, tipoSucesso);
        return result != null ? result : 0;
    }

    // @audit-ok [Execução(3) — INSERT no histórico com tipo_sucesso, valor_realizado, moedas_ganhas e sub_atividade_id]
    public void save(HistoricoExecucao historico) {
        jdbcTemplate.update(INSERT_HISTORICO,
                historico.getId() != null ? historico.getId() : UUID.randomUUID(),
                historico.getHabitoId(),
                historico.getSubAtividadeId(),
                historico.getExecutionToken(),
                historico.getDataHoraExecucao(),
                historico.getValorRealizado(),
                historico.getMoedasGanhas(),
                historico.getTipoSucesso());
    }
}
