package com.rodrigo.backend2java.execucao;
import java.util.List;
import java.util.UUID;
import java.time.LocalDate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import com.rodrigo.backend2java.execucao.model.HistoricoExecucao;
public interface HistoricoExecucaoRepository extends JpaRepository<HistoricoExecucao, UUID> {

    boolean existsByExecutionToken(UUID executionToken);

    @Query(value = "SELECT his_data_local AS data, SUM(his_valor_realizado) AS somaValor, COUNT(*) AS execucoes "
            + "FROM historico_execucoes "
            + "WHERE his_habito_id = ?1 AND his_data_local BETWEEN ?2 AND ?3 "
            + "AND his_tipo_sucesso IN ('COMPLETE_PADRAO', 'COMPLETE_EXTRA') "
            + "GROUP BY his_data_local", nativeQuery = true)
    List<AgregadoDiario> agregarPorDia(UUID habitoId, LocalDate inicio, LocalDate fim);

    @Query(value = "SELECT his_data_local AS data, SUM(his_valor_realizado) AS somaValor, COUNT(*) AS execucoes "
            + "FROM historico_execucoes "
            + "WHERE his_habito_id = ?1 AND his_data_local BETWEEN ?2 AND ?3 "
            + "AND his_tipo_sucesso IN ('DESISTENCIA', 'PROTEGIDO_ESCUDO', 'PROTEGIDO_AUTOMATICO') "
            + "GROUP BY his_data_local", nativeQuery = true)
    List<AgregadoDiario> agregarDesistenciasPorDia(UUID habitoId, LocalDate inicio, LocalDate fim);

    @Query(value = "SELECT his_sub_atividade_id AS subAtividadeId, SUM(his_valor_realizado) AS somaValor "
            + "FROM historico_execucoes "
            + "WHERE his_habito_id = ?1 AND his_data_local = ?2 "
            + "AND his_tipo_sucesso IN ('COMPLETE_PADRAO', 'COMPLETE_EXTRA', 'DISPENSADO') "
            + "GROUP BY his_sub_atividade_id", nativeQuery = true)
    List<AgregadoPorSubAtividade> agregarPorSubAtividadeNoDia(UUID habitoId, LocalDate dia);

    // Inclui as dispensadas (tipo DISPENSADO), que contam como feitas; o tipo vem junto para o
    // painel marcá-las sem uma segunda consulta.
    @Query(value = "SELECT his_habito_id AS habitoId, his_sub_atividade_id AS subAtividadeId, "
            + "his_tipo_sucesso AS tipo "
            + "FROM historico_execucoes "
            + "WHERE his_habito_id IN (?1) AND his_data_local = ?2 "
            + "AND his_tipo_sucesso IN ('COMPLETE_PADRAO', 'COMPLETE_EXTRA', 'DISPENSADO') "
            + "AND his_sub_atividade_id IS NOT NULL", nativeQuery = true)
    List<FeitoHojePorHabito> listarSubAtividadesFeitasHojeEmLote(List<UUID> habitoIds, LocalDate dia);

    // Dias do intervalo em que houve alguma ocorrência dispensada.
    @Query(value = "SELECT DISTINCT his_data_local FROM historico_execucoes "
            + "WHERE his_habito_id = ?1 AND his_data_local BETWEEN ?2 AND ?3 "
            + "AND his_tipo_sucesso = 'DISPENSADO'", nativeQuery = true)
    List<LocalDate> listarDiasComDispensa(UUID habitoId, LocalDate inicio, LocalDate fim);

    interface FeitoHojePorHabito {
        UUID getHabitoId();

        UUID getSubAtividadeId();

        String getTipo();
    }

    interface AgregadoPorSubAtividade {
        UUID getSubAtividadeId();

        Integer getSomaValor();
    }

    interface AgregadoDiario {
        LocalDate getData();

        Integer getSomaValor();

        Integer getExecucoes();
    }
}
