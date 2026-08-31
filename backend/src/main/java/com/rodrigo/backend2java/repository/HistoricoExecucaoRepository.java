package com.rodrigo.backend2java.repository;
import java.util.List;
import java.util.UUID;
import java.time.LocalDate;
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

    // @audit-ok [E2.2 (item 2) — agrega por dia (his_data_local) dentro da
    // janela pedida. Só conta execuções COMPLETE_PADRAO/COMPLETE_EXTRA — uma
    // DESISTENCIA ou um PROTEGIDO_ESCUDO não é "desempenho" pra contar como
    // meta cumprida nem pra entrar no recorde (ver StatsService). Dias sem
    // nenhuma linha simplesmente não aparecem aqui — StatsService é quem
    // preenche os buracos com zero (item 3).
    // E2.5: desistências passaram a ter sua PRÓPRIA agregação (ver
    // AGREGAR_DESISTENCIAS_POR_DIA/agregarDesistenciasPorDia abaixo) — elas
    // continuam fora desta consulta, mas agora aparecem no gráfico como barra
    // parcial em vez de simplesmente sumir.]
    private static final String AGREGAR_POR_DIA = "SELECT his_data_local, SUM(his_valor_realizado) AS soma_valor, COUNT(*) AS execucoes "
            +
            "FROM historico_execucoes " +
            "WHERE his_habito_id = ? AND his_data_local BETWEEN ? AND ? " +
            "AND his_tipo_sucesso IN ('COMPLETE_PADRAO', 'COMPLETE_EXTRA') " +
            "GROUP BY his_data_local";

    // @audit-ok [E2.5 (item 2) — RF10: mesmo formato de AGREGAR_POR_DIA, mas
    // para DESISTENCIA/PROTEGIDO_ESCUDO. StatsService só usa este resultado
    // num dia que NÃO tem nenhuma execução completa (ver obterEstatisticasSemanais).]
    private static final String AGREGAR_DESISTENCIAS_POR_DIA = "SELECT his_data_local, SUM(his_valor_realizado) AS soma_valor, COUNT(*) AS execucoes "
            +
            "FROM historico_execucoes " +
            "WHERE his_habito_id = ? AND his_data_local BETWEEN ? AND ? " +
            "AND his_tipo_sucesso IN ('DESISTENCIA', 'PROTEGIDO_ESCUDO') " +
            "GROUP BY his_data_local";

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

    // @audit-ok [E2.2 — usado por StatsService para montar os 7 dias de
    // GET /api/stats/weekly. Só devolve os dias que TÊM execução completa —
    // um Map, não uma lista de 7 posições; quem preenche os dias vazios com
    // zero é a camada de serviço, não o repository.]
    public List<AgregadoDiario> agregarPorDia(final UUID habitoId, final LocalDate inicio, final LocalDate fim) {
        return jdbcTemplate.query(AGREGAR_POR_DIA,
                (rs, rowNum) -> new AgregadoDiario(
                        rs.getObject("his_data_local", LocalDate.class),
                        rs.getInt("soma_valor"),
                        rs.getInt("execucoes")),
                habitoId, inicio, fim);
    }

    // @audit-ok [E2.5 — mesma consulta de agregarPorDia, filtrada a
    // desistências/proteções de escudo.]
    public List<AgregadoDiario> agregarDesistenciasPorDia(final UUID habitoId, final LocalDate inicio, final LocalDate fim) {
        return jdbcTemplate.query(AGREGAR_DESISTENCIAS_POR_DIA,
                (rs, rowNum) -> new AgregadoDiario(
                        rs.getObject("his_data_local", LocalDate.class),
                        rs.getInt("soma_valor"),
                        rs.getInt("execucoes")),
                habitoId, inicio, fim);
    }

    // @audit-ok [E2.2 — resultado bruto de uma linha de agregarPorDia. Record
    // interno de propósito: só existe pra transportar o resultado desta
    // consulta específica até StatsService, não é um model persistido.]
    public record AgregadoDiario(LocalDate data, Integer somaValor, Integer execucoes) {
    }
}
