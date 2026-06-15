package com.rodrigo.backend2java.repository;

import com.rodrigo.backend2java.model.BibliotecaTexto;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class BibliotecaTextoRepository {

        private static final String FIND_BY_CATEGORIA_AND_IDIOMA = "SELECT * FROM biblioteca_textos WHERE categoria = ? AND idioma = ?";

        private final JdbcTemplate jdbcTemplate;

        private final RowMapper<BibliotecaTexto> rowMapper = (rs, rowNum) -> BibliotecaTexto.builder()
                        .id(rs.getObject("id", UUID.class))
                        .categoria(rs.getString("categoria"))
                        .idioma(rs.getString("idioma"))
                        .textoPreTarefa(rs.getString("texto_pre_tarefa"))
                        .textoSucessoPadrao(rs.getString("texto_sucesso_padrao"))
                        .textoSucessoExtra(rs.getString("texto_sucesso_extra"))
                        .textoAvisoUrgencia(rs.getString("texto_aviso_urgencia"))
                        .build();

        public Optional<BibliotecaTexto> findByCategoriaAndIdioma(String categoria, String idioma) {
                return jdbcTemplate.query(FIND_BY_CATEGORIA_AND_IDIOMA, rowMapper, categoria, idioma)
                                .stream()
                                .findFirst();
        }
}
