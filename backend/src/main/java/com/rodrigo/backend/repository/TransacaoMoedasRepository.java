package com.rodrigo.backend.repository;

import java.util.UUID;
import java.time.OffsetDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.jdbc.core.JdbcTemplate;
import com.rodrigo.backend.model.TransacaoMoedas;

// @audit-ok [Execução(3) / Loja(3) — repositório do ledger de moedas; nunca há UPDATE ou DELETE nesta tabela]

@Repository
@RequiredArgsConstructor
public class TransacaoMoedasRepository {

    private static final String INSERT =
            "INSERT INTO transacoes_moedas (id, habito_id, execucao_id, tipo, valor, data_hora) " +
            "VALUES (?, ?, ?, ?, ?, ?)";

    private static final String SUM_SALDO =
            "SELECT COALESCE(SUM(valor), 0) FROM transacoes_moedas WHERE habito_id = ?";

    private static final String COUNT_BY_TIPO =
            "SELECT COUNT(1) FROM transacoes_moedas WHERE habito_id = ? AND tipo = ?";

    // @audit-ok [Concluir Dia(3) — verifica se a recompensa do dia já foi creditada (idempotência da apuração)]
    private static final String EXISTS_CREDITO_NO_DIA =
            "SELECT COUNT(1) FROM transacoes_moedas WHERE habito_id = ? " +
            "AND tipo LIKE 'CREDITO%' AND data_hora >= ? AND data_hora < ?";

    private final JdbcTemplate jdbcTemplate;

    // @audit-ok [Execução(3) / Loja(3) — INSERT imutável no ledger; representa um crédito ou débito de moedas]
    public void save(TransacaoMoedas transacao) {
        jdbcTemplate.update(INSERT,
                transacao.getId() != null ? transacao.getId() : UUID.randomUUID(),
                transacao.getHabitoId(),
                transacao.getExecucaoId(),
                transacao.getTipo(),
                transacao.getValor(),
                transacao.getDataHora());
    }

    // @audit-ok [Dashboard(3) / Execução(3) — SUM(valor) calcula saldo atual; COALESCE garante 0 se sem transações]
    public int findSaldoByHabitoId(UUID habitoId) {
        Integer result = jdbcTemplate.queryForObject(SUM_SALDO, Integer.class, habitoId);
        return result != null ? result : 0;
    }

    // @audit-ok [Dashboard(3) / Loja(3) — COUNT por tipo; usado para inventário de escudos (DEBITO_ESCUDO)]
    public int countByTipoAndHabitoId(UUID habitoId, String tipo) {
        Integer result = jdbcTemplate.queryForObject(COUNT_BY_TIPO, Integer.class, habitoId, tipo);
        return result != null ? result : 0;
    }

    // @audit-ok [Concluir Dia(3) — true se já existe um crédito (recompensa) lançado no intervalo do dia]
    public boolean existsCreditoNoDia(UUID habitoId, OffsetDateTime inicio, OffsetDateTime fim) {
        Integer result = jdbcTemplate.queryForObject(EXISTS_CREDITO_NO_DIA, Integer.class, habitoId, inicio, fim);
        return result != null && result > 0;
    }
}
