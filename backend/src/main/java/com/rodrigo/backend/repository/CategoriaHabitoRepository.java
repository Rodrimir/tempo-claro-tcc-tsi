package com.rodrigo.backend.repository;

import java.util.UUID;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import org.springframework.jdbc.core.JdbcTemplate;
import com.rodrigo.backend.model.CategoriaHabito;

// @audit-ok [Criar Hábito(3) — repositório do catálogo de moldes; valida código antes de qualquer INSERT em habitos]

@Repository
@RequiredArgsConstructor
public class CategoriaHabitoRepository {

    private static final String FIND_BY_CODIGO = "SELECT * FROM categorias_habito WHERE codigo = ?";
    private static final String FIND_BY_ID    = "SELECT * FROM categorias_habito WHERE id = ?";

    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<CategoriaHabito> rowMapper = (rs, rowNum) -> CategoriaHabito.builder()
            .id(rs.getObject("id", UUID.class))
            .codigo(rs.getString("codigo"))
            .nome(rs.getString("nome"))
            .unidadeMedida(rs.getString("unidade_medida"))
            .corHex(rs.getString("cor_hex"))
            .iconeUrl(rs.getString("icone_url"))
            .build();

    // @audit-ok [Criar Hábito(3) — busca categoria pelo código; service lança exceção se não encontrado]
    public Optional<CategoriaHabito> findByCodigo(String codigo) {
        return jdbcTemplate.query(FIND_BY_CODIGO, rowMapper, codigo).stream().findFirst();
    }

    // @audit-ok [Dashboard(3) — resolve detalhes da categoria ao montar o HabitoResponseDTO]
    public Optional<CategoriaHabito> findById(UUID id) {
        return jdbcTemplate.query(FIND_BY_ID, rowMapper, id).stream().findFirst();
    }
}