package com.rodrigo.backend.repository;

import java.util.UUID;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import org.springframework.jdbc.core.JdbcTemplate;
import com.rodrigo.backend.model.BibliotecaTexto;

// @audit-ok [Priming(3) — repositório de frases motivacionais; busca por categoriaId UUID ou fallback genérico (NULL)]

@Repository
@RequiredArgsConstructor
public class BibliotecaTextoRepository {

        private static final String FIND_BY_CATEGORIA_ID_AND_IDIOMA =
                "SELECT * FROM biblioteca_textos WHERE categoria_id = ? AND idioma = ?";

        private static final String FIND_GENERICO_BY_IDIOMA =
                "SELECT * FROM biblioteca_textos WHERE categoria_id IS NULL AND idioma = ?";

        private final JdbcTemplate jdbcTemplate;

        private final RowMapper<BibliotecaTexto> rowMapper = (rs, rowNum) -> BibliotecaTexto.builder()
                        .id(rs.getObject("id", UUID.class))
                        .categoriaId(rs.getObject("categoria_id", UUID.class))
                        .idioma(rs.getString("idioma"))
                        .textoPreTarefa(rs.getString("texto_pre_tarefa"))
                        .textoSucessoPadrao(rs.getString("texto_sucesso_padrao"))
                        .textoSucessoExtra(rs.getString("texto_sucesso_extra"))
                        .textoAvisoUrgencia(rs.getString("texto_aviso_urgencia"))
                        .build();

        // @audit-ok [Priming(3) — busca texto por categoriaId e idioma; retorna vazio se não houver entrada específica]
        public Optional<BibliotecaTexto> findByCategoriaIdAndIdioma(UUID categoriaId, String idioma) {
                return jdbcTemplate.query(FIND_BY_CATEGORIA_ID_AND_IDIOMA, rowMapper, categoriaId, idioma)
                                .stream().findFirst();
        }

        // @audit-ok [Priming(3) — fallback: texto genérico sem categoria quando não há entrada específica]
        public Optional<BibliotecaTexto> findGenericoByIdioma(String idioma) {
                return jdbcTemplate.query(FIND_GENERICO_BY_IDIOMA, rowMapper, idioma)
                                .stream().findFirst();
        }
}