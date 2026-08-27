package com.rodrigo.backend2java.repository;
import java.util.UUID;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import org.springframework.jdbc.core.JdbcTemplate;
import com.rodrigo.backend2java.model.BibliotecaTexto;

// @audit-ok [Schema v2.1 — tabela biblioteca_textos agora usa prefixo bib_*.
// A carga inicial (antes em data.sql) passou para a Seção 11 do schema.sql.]
@Repository
@RequiredArgsConstructor
public class BibliotecaTextoRepository {

        private static final String FIND_BY_CATEGORIA_AND_IDIOMA = "SELECT * FROM biblioteca_textos WHERE bib_categoria = ? AND bib_idioma = ?";

        private final JdbcTemplate jdbcTemplate;

        private final RowMapper<BibliotecaTexto> rowMapper = (rs, rowNum) -> BibliotecaTexto.builder()
                        .id(rs.getObject("bib_id", UUID.class))
                        .categoria(rs.getString("bib_categoria"))
                        .idioma(rs.getString("bib_idioma"))
                        .textoPreTarefa(rs.getString("bib_texto_pre_tarefa"))
                        .textoSucessoPadrao(rs.getString("bib_texto_sucesso_padrao"))
                        .textoSucessoExtra(rs.getString("bib_texto_sucesso_extra"))
                        .textoAvisoUrgencia(rs.getString("bib_texto_aviso_urgencia"))
                        .build();

        public Optional<BibliotecaTexto> findByCategoriaAndIdioma(String categoria, String idioma) {
                return jdbcTemplate.query(FIND_BY_CATEGORIA_AND_IDIOMA, rowMapper, categoria, idioma)
                                .stream()
                                .findFirst();
        }
}
