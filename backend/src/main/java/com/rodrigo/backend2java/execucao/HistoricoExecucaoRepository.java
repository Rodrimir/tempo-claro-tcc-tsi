package com.rodrigo.backend2java.execucao;
import java.util.List;
import java.util.UUID;
import java.time.LocalDate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
// @audit-ok [Execução Timer (21) / Execução Timer (25) — repositório de histórico de execuções; chave de idempotência via execution_token UNIQUE]
//
// Schema v3.0: his_sub_atividade_id passou a ser preenchida em toda conclusão, e
// é o que sustenta agregarPorSubAtividadeNoDia — a consulta que o fechamento usa
// para ratear as moedas por ocorrência executada (RF12).
public interface HistoricoExecucaoRepository extends JpaRepository<HistoricoExecucao, UUID> {

    // @audit-ok [Execução Timer  — COUNT por execution_token; retorna true se já foi processado (idempotência)]
    boolean existsByExecutionToken(UUID executionToken);

    // @audit-ok [E2.2 (item 2) — agrega por dia (his_data_local) dentro da
    // janela pedida. Só conta execuções COMPLETE_PADRAO/COMPLETE_EXTRA — uma
    // DESISTENCIA ou um PROTEGIDO_ESCUDO não é "desempenho" pra contar como
    // meta cumprida nem pra entrar no recorde (ver StatsService). Dias sem
    // nenhuma linha simplesmente não aparecem aqui — StatsService é quem
    // preenche os buracos com zero (item 3).
    // E2.5: desistências passaram a ter sua PRÓPRIA agregação (ver
    // agregarDesistenciasPorDia abaixo) — elas continuam fora desta consulta,
    // mas agora aparecem no gráfico como barra parcial em vez de simplesmente
    // sumir.]
    @Query(value = "SELECT his_data_local AS data, SUM(his_valor_realizado) AS somaValor, COUNT(*) AS execucoes "
            + "FROM historico_execucoes "
            + "WHERE his_habito_id = ?1 AND his_data_local BETWEEN ?2 AND ?3 "
            + "AND his_tipo_sucesso IN ('COMPLETE_PADRAO', 'COMPLETE_EXTRA') "
            + "GROUP BY his_data_local", nativeQuery = true)
    List<AgregadoDiario> agregarPorDia(UUID habitoId, LocalDate inicio, LocalDate fim);

    // @audit-ok [E2.5 (item 2) — RF10: mesmo formato de agregarPorDia, mas
    // para DESISTENCIA/PROTEGIDO_ESCUDO. StatsService só usa este resultado
    // num dia que NÃO tem nenhuma execução completa (ver obterEstatisticas).]
    //
    // v3.0: PROTEGIDO_AUTOMATICO entra aqui também — é a linha que o fechamento
    // grava quando consome um escudo sozinho, e um dia assim é exatamente o que
    // o gráfico deve mostrar como parcial em vez de como buraco.
    @Query(value = "SELECT his_data_local AS data, SUM(his_valor_realizado) AS somaValor, COUNT(*) AS execucoes "
            + "FROM historico_execucoes "
            + "WHERE his_habito_id = ?1 AND his_data_local BETWEEN ?2 AND ?3 "
            + "AND his_tipo_sucesso IN ('DESISTENCIA', 'PROTEGIDO_ESCUDO', 'PROTEGIDO_AUTOMATICO') "
            + "GROUP BY his_data_local", nativeQuery = true)
    List<AgregadoDiario> agregarDesistenciasPorDia(UUID habitoId, LocalDate inicio, LocalDate fim);

    // O realizado de UM dia, quebrado por ocorrência. É a matéria-prima do rateio
    // de moedas no fechamento (RF12): cada sub_atividade vale uma cota igual do
    // pote do dia, e a cota só é creditada na proporção do que foi feito nela.
    //
    // Lê do histórico em vez de sta_valor_acumulado_hoje de propósito: o job pode
    // ficar horas sem rodar (a instância do Render suspende por inatividade), e aí
    // o contador de "hoje" já misturou mais de um dia. his_data_local não mistura.
    //
    // his_sub_atividade_id pode ser NULL em linha antiga ou de hábito reconfigurado
    // (a FK é ON DELETE SET NULL) — o fechamento trata esse caso à parte.
    @Query(value = "SELECT his_sub_atividade_id AS subAtividadeId, SUM(his_valor_realizado) AS somaValor "
            + "FROM historico_execucoes "
            + "WHERE his_habito_id = ?1 AND his_data_local = ?2 "
            + "AND his_tipo_sucesso IN ('COMPLETE_PADRAO', 'COMPLETE_EXTRA') "
            + "GROUP BY his_sub_atividade_id", nativeQuery = true)
    List<AgregadoPorSubAtividade> agregarPorSubAtividadeNoDia(UUID habitoId, LocalDate dia);

    // Quais sub_atividades já foram cumpridas HOJE, para vários hábitos numa
    // consulta só — é o que sustenta o status por ocorrência (FEITO/FALHOU/
    // ATIVA/PENDENTE) sem o dashboard voltar a custar uma consulta por hábito
    // (ver HabitoDashboardQueryCountTest). his_sub_atividade_id pode ser NULL
    // (linha antiga, ou hábito reconfigurado — a FK é ON DELETE SET NULL); o
    // filtro descarta essas linhas porque não há ocorrência atual pra marcar.
    @Query(value = "SELECT his_habito_id AS habitoId, his_sub_atividade_id AS subAtividadeId "
            + "FROM historico_execucoes "
            + "WHERE his_habito_id IN (?1) AND his_data_local = ?2 "
            + "AND his_tipo_sucesso IN ('COMPLETE_PADRAO', 'COMPLETE_EXTRA') "
            + "AND his_sub_atividade_id IS NOT NULL", nativeQuery = true)
    List<FeitoHojePorHabito> listarSubAtividadesFeitasHojeEmLote(List<UUID> habitoIds, LocalDate dia);

    interface FeitoHojePorHabito {
        UUID getHabitoId();

        UUID getSubAtividadeId();
    }

    interface AgregadoPorSubAtividade {
        UUID getSubAtividadeId();

        Integer getSomaValor();
    }

    // @audit-ok [E2.2 — resultado bruto de uma linha de agregarPorDia. Interface
    // projection de propósito: só existe pra transportar o resultado desta
    // consulta específica até StatsService, não é um model persistido.]
    interface AgregadoDiario {
        LocalDate getData();

        Integer getSomaValor();

        Integer getExecucoes();
    }
}
