package com.rodrigo.backend2java.repository;
import java.util.UUID;
import java.util.Optional;
import java.time.OffsetDateTime;
import lombok.RequiredArgsConstructor;
import com.rodrigo.backend2java.model.Usuario;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import org.springframework.jdbc.core.JdbcTemplate;

// @audit-ok [Schema v2.1 — tabela usuarios agora usa prefixo usu_*. Nomes de
// campo do model Usuario.java e dos DTOs não mudam, só as strings SQL e o
// RowMapper. usu_tema e usu_atualizado_em (novas colunas, ambas com DEFAULT)
// não têm campo correspondente no model ainda — ficam com o valor padrão do
// banco até alguma tarefa futura precisar delas.]
@Repository
@RequiredArgsConstructor
public class UsuarioRepository {

        private static final String FIND_BY_ID = "SELECT * FROM usuarios WHERE usu_id = ?";

        private static final String FIND_BY_EMAIL = "SELECT * FROM usuarios WHERE usu_email = ?";

        private static final String COUNT_BY_EMAIL = "SELECT COUNT(1) FROM usuarios WHERE usu_email = ?";

        private static final String INSERT_USUARIO = "INSERT INTO usuarios (usu_id, usu_nome, usu_email, usu_senha_hash, usu_fuso_horario, usu_preferencia_idioma, usu_criado_em) "
                        +
                        "VALUES (?, ?, ?, ?, ?, ?, ?)";

        // usu_atualizado_em é atualizado aqui via CURRENT_TIMESTAMP — não precisa de
        // campo Java, a coluna existe justamente para isso.
        private static final String UPDATE_USUARIO = "UPDATE usuarios SET usu_nome = ?, usu_email = ?, usu_senha_hash = ?, usu_fuso_horario = ?, "
                        +
                        "usu_preferencia_idioma = ?, usu_atualizado_em = CURRENT_TIMESTAMP WHERE usu_id = ?";

        private final JdbcTemplate jdbcTemplate;

        // @audit-info [RowMapper mapeia o ResultSet para a entidade Usuario]
        private final RowMapper<Usuario> rowMapper = (rs, rowNum) -> Usuario.builder()
                        .id(rs.getObject("usu_id", UUID.class))
                        .nome(rs.getString("usu_nome"))
                        .email(rs.getString("usu_email"))
                        .senhaHash(rs.getString("usu_senha_hash"))
                        .fusoHorario(rs.getString("usu_fuso_horario"))
                        .preferenciaIdioma(rs.getString("usu_preferencia_idioma"))
                        .criadoEm(rs.getObject("usu_criado_em", OffsetDateTime.class))
                        .build();

        public Optional<Usuario> findById(UUID id) {
                return jdbcTemplate.query(FIND_BY_ID, rowMapper, id)
                                .stream()
                                .findFirst();
        }

        // @audit-ok [Login(3) — repository de autenticação: verifica se existe antes de autenticar: POST /auth/login]
        // @audit-ok [Profile(3) — repository de perfil: verifica se existe antes de atualizar: PUT /api/profile]
        public Optional<Usuario> findByEmail(String email) {
                return jdbcTemplate.query(FIND_BY_EMAIL, rowMapper, email)
                                .stream()
                                .findFirst();
        }

        // @audit-ok [Cadastro(3) — repository de autenticação: COUNT para verificar existência sem trazer dados: POST /auth/register]
        public boolean existsByEmail(String email) {
                Integer count = jdbcTemplate.queryForObject(COUNT_BY_EMAIL, Integer.class, email);
                return count != null && count > 0;
        }

        // @audit-ok [Cadastro(4) — repository de autenticação: INSERT com todos os campos do usuário incluindo hash da senha]
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

        // @audit-ok [Profile(4) — repository de perfil: atualiza campos editáveis do usuário exceto criado_em: PUT /api/profile]
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
