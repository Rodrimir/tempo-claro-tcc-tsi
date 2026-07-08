package com.rodrigo.backend.repository;

import java.util.UUID;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import org.springframework.jdbc.core.JdbcTemplate;
import com.rodrigo.backend.model.AvatarCatalogo;

// @audit-ok [Dashboard(3) — repositório do catálogo de avatares; retorna o asset de maior streak_minimo <= ofensiva atual]

@Repository
@RequiredArgsConstructor
public class AvatarCatalogoRepository {

    private static final String FIND_BY_CATEGORIA_AND_STREAK =
            "SELECT * FROM avatares_catalogo " +
            "WHERE categoria_id = ? AND estado_expressao = ? AND streak_minimo <= ? " +
            "ORDER BY streak_minimo DESC LIMIT 1";

    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<AvatarCatalogo> rowMapper = (rs, rowNum) -> AvatarCatalogo.builder()
            .id(rs.getObject("id", UUID.class))
            .categoriaId(rs.getObject("categoria_id", UUID.class))
            .nome(rs.getString("nome"))
            .streakMinimo(rs.getInt("streak_minimo"))
            .estadoExpressao(rs.getString("estado_expressao"))
            .assetVisualUrl(rs.getString("asset_visual_url"))
            .ordemEvolucao(rs.getObject("ordem_evolucao", Integer.class))
            .build();

    // @audit-ok [Dashboard(3) — busca avatar de maior tier aplicável: categoria + estado + streak_minimo <= ofensiva]
    public Optional<AvatarCatalogo> findByCategoriaAndStreak(UUID categoriaId, String estadoExpressao, int streak) {
        return jdbcTemplate.query(FIND_BY_CATEGORIA_AND_STREAK, rowMapper, categoriaId, estadoExpressao, streak)
                .stream().findFirst();
    }
}
