package com.rodrigo.backend2java.repository;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.jdbc.core.JdbcTemplate;
import com.rodrigo.backend2java.model.HistoricoExecucao;
// @audit-ok [Execução Timer (21) / Execução Timer (25) — repositório de histórico de execuções; chave de idempotência via execution_token UNIQUE]
//
// @audit-ok [Schema v2.1 — tabela historico_execucoes agora usa prefixo his_*.
// his_sub_atividade_id (nova, nullable, FK para sub_atividades) não é
// referenciada aqui — nenhuma execução está ligada a uma sub_atividade ainda,
// então a coluna fica NULL por omissão no INSERT (comportamento padrão do
// Postgres para coluna nullable ausente na lista). his_data_local (NOT NULL,
// sem DEFAULT) vem do novo campo HistoricoExecucao.dataLocal.]
@Repository
@RequiredArgsConstructor
public class HistoricoExecucaoRepository {

    private static final String COUNT_BY_EXECUTION_TOKEN = "SELECT COUNT(1) FROM historico_execucoes WHERE his_execution_token = ?";

    private static final String INSERT_HISTORICO = "INSERT INTO historico_execucoes (his_id, his_habito_id, his_execution_token, his_data_hora, "
            +
            "his_valor_realizado, his_moedas_ganhas, his_tipo_sucesso, his_data_local) " +
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

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
                historico.getTipoSucesso(),
                historico.getDataLocal());
    }
}
