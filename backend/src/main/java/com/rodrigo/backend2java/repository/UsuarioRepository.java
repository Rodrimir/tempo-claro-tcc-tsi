package com.rodrigo.backend2java.repository;

import com.rodrigo.backend2java.model.Usuario;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class UsuarioRepository {

        private static final String FIND_BY_ID = "SELECT * FROM usuarios WHERE id = ?";

        private static final String FIND_BY_EMAIL = "SELECT * FROM usuarios WHERE email = ?";

        private static final String COUNT_BY_EMAIL = "SELECT COUNT(1) FROM usuarios WHERE email = ?";

        private static final String INSERT_USUARIO = "INSERT INTO usuarios (id, nome, email, senha_hash, fuso_horario, preferencia_idioma, criado_em) "
                        +
                        "VALUES (?, ?, ?, ?, ?, ?, ?)";

        private static final String UPDATE_USUARIO = "UPDATE usuarios SET nome = ?, email = ?, senha_hash = ?, fuso_horario = ?, preferencia_idioma = ? WHERE id = ?";

        private final JdbcTemplate jdbcTemplate;

        private final RowMapper<Usuario> rowMapper = (rs, rowNum) -> Usuario.builder()
                        .id(rs.getObject("id", UUID.class))
                        .nome(rs.getString("nome"))
                        .email(rs.getString("email"))
                        .senhaHash(rs.getString("senha_hash"))
                        .fusoHorario(rs.getString("fuso_horario"))
                        .preferenciaIdioma(rs.getString("preferencia_idioma"))
                        .criadoEm(rs.getObject("criado_em", OffsetDateTime.class))
                        .build();

        public Optional<Usuario> findById(UUID id) {
                return jdbcTemplate.query(FIND_BY_ID, rowMapper, id)
                                .stream()
                                .findFirst();
        }

        public Optional<Usuario> findByEmail(String email) {
                return jdbcTemplate.query(FIND_BY_EMAIL, rowMapper, email)
                                .stream()
                                .findFirst();
        }

        public boolean existsByEmail(String email) {
                Integer count = jdbcTemplate.queryForObject(COUNT_BY_EMAIL, Integer.class, email);
                return count != null && count > 0;
        }

        public void save(Usuario usuario) {
                jdbcTemplate.update(INSERT_USUARIO,
                                usuario.getId() != null ? usuario.getId() : UUID.randomUUID(),
                                usuario.getNome(),
                                usuario.getEmail(),
                                usuario.getSenhaHash(),
                                usuario.getFusoHorario(),
                                usuario.getPreferenciaIdioma(),
                                usuario.getCriadoEm());
        }

        public void update(Usuario usuario) {
                jdbcTemplate.update(UPDATE_USUARIO,
                                usuario.getNome(),
                                usuario.getEmail(),
                                usuario.getSenhaHash(),
                                usuario.getFusoHorario(),
                                usuario.getPreferenciaIdioma(),
                                usuario.getId());
        }
}
