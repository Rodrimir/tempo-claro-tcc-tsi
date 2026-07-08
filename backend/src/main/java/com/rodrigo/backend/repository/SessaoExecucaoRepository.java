package com.rodrigo.backend.repository;

import java.util.UUID;
import java.util.Optional;
import java.time.OffsetDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import org.springframework.jdbc.core.JdbcTemplate;
import com.rodrigo.backend.model.SessaoExecucao;

// @audit-ok [Execução(3) — repositório de sessões ativas; UNIQUE parcial no banco impede duas sessões vivas por hábito]

@Repository
@RequiredArgsConstructor
public class SessaoExecucaoRepository {

    private static final String INSERT =
            "INSERT INTO sessoes_execucao " +
            "(id, habito_id, sub_atividade_id, iniciada_em, valor_parcial, estado, expira_em) " +
            "VALUES (?, ?, ?, ?, ?, ?, ?)";

    private static final String FIND_BY_ID =
            "SELECT * FROM sessoes_execucao WHERE id = ?";

    private static final String FIND_ATIVA_BY_HABITO =
            "SELECT * FROM sessoes_execucao WHERE habito_id = ? AND estado IN ('EM_EXECUCAO','PAUSADO') LIMIT 1";

    private static final String UPDATE =
            "UPDATE sessoes_execucao SET estado = ?, pausada_em = ?, valor_parcial = ? WHERE id = ?";

    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<SessaoExecucao> rowMapper = (rs, rowNum) -> SessaoExecucao.builder()
            .id(rs.getObject("id", UUID.class))
            .habitoId(rs.getObject("habito_id", UUID.class))
            .subAtividadeId(rs.getObject("sub_atividade_id", UUID.class))
            .iniciadaEm(rs.getObject("iniciada_em", OffsetDateTime.class))
            .pausadaEm(rs.getObject("pausada_em", OffsetDateTime.class))
            .valorParcial(rs.getInt("valor_parcial"))
            .estado(rs.getString("estado"))
            .expiraEm(rs.getObject("expira_em", OffsetDateTime.class))
            .build();

    // @audit-ok [Execução(3) — INSERT de nova sessão; a constraint UNIQUE parcial do banco rejeita duplicatas ativas]
    public void save(SessaoExecucao sessao) {
        jdbcTemplate.update(INSERT,
                sessao.getId(),
                sessao.getHabitoId(),
                sessao.getSubAtividadeId(),
                sessao.getIniciadaEm(),
                sessao.getValorParcial(),
                sessao.getEstado(),
                sessao.getExpiraEm());
    }

    // @audit-ok [Execução(3) — busca sessão por id para pausar ou retomar]
    public Optional<SessaoExecucao> findById(UUID id) {
        return jdbcTemplate.query(FIND_BY_ID, rowMapper, id).stream().findFirst();
    }

    // @audit-ok [Execução(3) — busca sessão viva (EM_EXECUCAO ou PAUSADO) do hábito; retorna vazia se nenhuma ativa]
    public Optional<SessaoExecucao> findAtivaByHabitoId(UUID habitoId) {
        return jdbcTemplate.query(FIND_ATIVA_BY_HABITO, rowMapper, habitoId).stream().findFirst();
    }

    // @audit-ok [Execução(3) — UPDATE de estado, pausada_em e valor_parcial; pausada_em = NULL ao retomar]
    public void update(SessaoExecucao sessao) {
        jdbcTemplate.update(UPDATE,
                sessao.getEstado(),
                sessao.getPausadaEm(),
                sessao.getValorParcial(),
                sessao.getId());
    }
}
