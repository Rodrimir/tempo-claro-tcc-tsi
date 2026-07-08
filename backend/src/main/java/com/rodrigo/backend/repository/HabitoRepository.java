package com.rodrigo.backend.repository;

import java.util.UUID;
import java.util.List;
import java.util.Optional;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import lombok.RequiredArgsConstructor;
import com.rodrigo.backend.model.Habito;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import org.springframework.jdbc.core.JdbcTemplate;

// @audit-ok [Dashboard(3) / Criar Hábito(3) — repositório de hábitos via JdbcTemplate; queries explícitas sem ORM]

@Repository
@RequiredArgsConstructor
public class HabitoRepository {

        private static final String FIND_ALL_BY_USUARIO_ID =
                "SELECT * FROM habitos WHERE usuario_id = ? AND ativo = TRUE AND arquivado_em IS NULL";

        private static final String FIND_ALL_ATIVOS =
                "SELECT * FROM habitos WHERE ativo = TRUE AND arquivado_em IS NULL";

        private static final String FIND_BY_ID =
                "SELECT * FROM habitos WHERE id = ?";

        private static final String INSERT_HABITO =
                "INSERT INTO habitos (id, usuario_id, categoria_id, titulo, gatilho_ancora, horario_agendado, " +
                "tipo_medida, meta_base, meta_maxima, dias_para_aumento, incremento_meta, ativo, criado_em) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        private static final String UPDATE_HABITO =
                "UPDATE habitos SET titulo = ?, meta_base = ?, meta_maxima = ?, dias_para_aumento = ?, " +
                "incremento_meta = ?, horario_agendado = ?, gatilho_ancora = ?, ativo = ? WHERE id = ?";

        private static final String ARCHIVE_HABITO =
                "UPDATE habitos SET ativo = FALSE, arquivado_em = now() WHERE id = ?";

        private final JdbcTemplate jdbcTemplate;

        // @audit-ok [Dashboard(3) — RowMapper mapeia cada linha do ResultSet para a entidade Habito do novo schema]
        private final RowMapper<Habito> rowMapper = (rs, rowNum) -> Habito.builder()
                        .id(rs.getObject("id", UUID.class))
                        .usuarioId(rs.getObject("usuario_id", UUID.class))
                        .categoriaId(rs.getObject("categoria_id", UUID.class))
                        .titulo(rs.getString("titulo"))
                        .gatilhoAncora(rs.getString("gatilho_ancora"))
                        .horarioAgendado(rs.getObject("horario_agendado", LocalTime.class))
                        .tipoMedida(rs.getString("tipo_medida"))
                        .metaBase(rs.getInt("meta_base"))
                        .metaMaxima(rs.getObject("meta_maxima") != null ? rs.getInt("meta_maxima") : null)
                        .diasParaAumento(rs.getObject("dias_para_aumento") != null ? rs.getInt("dias_para_aumento") : null)
                        .incrementoMeta(rs.getObject("incremento_meta") != null ? rs.getInt("incremento_meta") : null)
                        .ativo(rs.getBoolean("ativo"))
                        .arquivadoEm(rs.getObject("arquivado_em", OffsetDateTime.class))
                        .criadoEm(rs.getObject("criado_em", OffsetDateTime.class))
                        .build();

        // @audit-ok [Dashboard(3) — retorna apenas hábitos ativos e não arquivados do usuário]
        public List<Habito> findAllByUsuarioId(UUID usuarioId) {
                return jdbcTemplate.query(FIND_ALL_BY_USUARIO_ID, rowMapper, usuarioId);
        }

        public Optional<Habito> findById(UUID id) {
                return jdbcTemplate.query(FIND_BY_ID, rowMapper, id).stream().findFirst();
        }

        // @audit-ok [Fechamento Diário(3) — todos os hábitos ativos do sistema; usado pelo job de virada de dia]
        public List<Habito> findAllAtivos() {
                return jdbcTemplate.query(FIND_ALL_ATIVOS, rowMapper);
        }

        // @audit-ok [Criar Hábito(3) — INSERT com todos os campos do novo schema; UUID gerado pelo service]
        public void save(Habito habito) {
                jdbcTemplate.update(INSERT_HABITO,
                                habito.getId() != null ? habito.getId() : UUID.randomUUID(),
                                habito.getUsuarioId(),
                                habito.getCategoriaId(),
                                habito.getTitulo(),
                                habito.getGatilhoAncora(),
                                habito.getHorarioAgendado(),
                                habito.getTipoMedida(),
                                habito.getMetaBase(),
                                habito.getMetaMaxima(),
                                habito.getDiasParaAumento(),
                                habito.getIncrementoMeta(),
                                habito.getAtivo(),
                                habito.getCriadoEm());
        }

        // @audit-ok [Atualizar Hábito(3) — UPDATE dos campos editáveis do hábito]
        public void update(Habito habito) {
                jdbcTemplate.update(UPDATE_HABITO,
                                habito.getTitulo(),
                                habito.getMetaBase(),
                                habito.getMetaMaxima(),
                                habito.getDiasParaAumento(),
                                habito.getIncrementoMeta(),
                                habito.getHorarioAgendado(),
                                habito.getGatilhoAncora(),
                                habito.getAtivo(),
                                habito.getId());
        }

        // @audit-ok [Deletar Hábito(3) — soft delete: seta ativo=FALSE e arquivado_em=now() preservando histórico]
        public void archive(UUID id) {
                jdbcTemplate.update(ARCHIVE_HABITO, id);
        }
}