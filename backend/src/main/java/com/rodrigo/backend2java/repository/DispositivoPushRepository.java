package com.rodrigo.backend2java.repository;
import java.util.UUID;
import java.util.List;
import java.util.Optional;
import java.time.OffsetDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import org.springframework.jdbc.core.JdbcTemplate;
import com.rodrigo.backend2java.model.DispositivoPush;

// @audit-ok [Schema v2.1, tabela dispositivos_push — repositório criado na
// E0.5.3 só para existir (D3: RF18/RF19/RNF16 são trabalho futuro). Sem uso
// em nenhum service.]
@Repository
@RequiredArgsConstructor
public class DispositivoPushRepository {

        private static final String FIND_ALL_ATIVOS_BY_USUARIO_ID = "SELECT * FROM dispositivos_push WHERE dis_usuario_id = ? AND dis_ativo = true";

        private static final String FIND_BY_ID = "SELECT * FROM dispositivos_push WHERE dis_id = ?";

        private static final String INSERT_DISPOSITIVO = "INSERT INTO dispositivos_push (dis_id, dis_usuario_id, dis_token_dispositivo, dis_plataforma, dis_ativo, dis_criado_em, dis_ultimo_uso) "
                        +
                        "VALUES (?, ?, ?, ?, ?, ?, ?)";

        private final JdbcTemplate jdbcTemplate;

        private final RowMapper<DispositivoPush> rowMapper = (rs, rowNum) -> DispositivoPush.builder()
                        .id(rs.getObject("dis_id", UUID.class))
                        .usuarioId(rs.getObject("dis_usuario_id", UUID.class))
                        .tokenDispositivo(rs.getString("dis_token_dispositivo"))
                        .plataforma(rs.getString("dis_plataforma"))
                        .ativo(rs.getBoolean("dis_ativo"))
                        .criadoEm(rs.getObject("dis_criado_em", OffsetDateTime.class))
                        .ultimoUso(rs.getObject("dis_ultimo_uso", OffsetDateTime.class))
                        .build();

        // Reflete o índice parcial ix_dis_usuario (WHERE dis_ativo) do schema v2.1.
        public List<DispositivoPush> findAllAtivosByUsuarioId(UUID usuarioId) {
                return jdbcTemplate.query(FIND_ALL_ATIVOS_BY_USUARIO_ID, rowMapper, usuarioId);
        }

        public Optional<DispositivoPush> findById(UUID id) {
                return jdbcTemplate.query(FIND_BY_ID, rowMapper, id)
                                .stream()
                                .findFirst();
        }

        public void save(DispositivoPush dispositivo) {
                jdbcTemplate.update(INSERT_DISPOSITIVO,
                                dispositivo.getId() != null ? dispositivo.getId() : UUID.randomUUID(),
                                dispositivo.getUsuarioId(),
                                dispositivo.getTokenDispositivo(),
                                dispositivo.getPlataforma(),
                                dispositivo.getAtivo(),
                                dispositivo.getCriadoEm(),
                                dispositivo.getUltimoUso());
        }
}
