package com.rodrigo.backend2java.repository;

import com.rodrigo.backend2java.model.HistoricoExecucao;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.UUID;

// @audit-ok [Execução Timer (21) / Execução Timer (25) — repositório de histórico de execuções; chave de idempotência via execution_token UNIQUE]

@Repository
@RequiredArgsConstructor
public class HistoricoExecucaoRepository {

    private static final String COUNT_BY_EXECUTION_TOKEN = "SELECT COUNT(1) FROM historico_execucoes WHERE execution_token = ?";

    private static final String INSERT_HISTORICO = "INSERT INTO historico_execucoes (id, habito_id, execution_token, data_hora_execucao, "
            +
            "valor_realizado, moedas_ganhas, tipo_sucesso) " +
            "VALUES (?, ?, ?, ?, ?, ?, ?)";

    private final JdbcTemplate jdbcTemplate;

    // @audit-ok [Execução Timer  — COUNT por execution_token; retorna true se já foi processado (idempotência)]
    public boolean existsByExecutionToken(UUID executionToken) {
        Integer count = jdbcTemplate.queryForObject(COUNT_BY_EXECUTION_TOKEN, Integer.class, executionToken);
        return count != null && count > 0;
    }

    // @audit-ok [Execução Timer — INSERT no histórico com tipo_sucesso, valor_realizado e moedas_ganhas]
    public void save(HistoricoExecucao historico) {
        jdbcTemplate.update(INSERT_HISTORICO,
                historico.getId() != null ? historico.getId() : UUID.randomUUID(),
                historico.getHabitoId(),
                historico.getExecutionToken(),
                historico.getDataHoraExecucao(),
                historico.getValorRealizado(),
                historico.getMoedasGanhas(),
                historico.getTipoSucesso());
    }
}
