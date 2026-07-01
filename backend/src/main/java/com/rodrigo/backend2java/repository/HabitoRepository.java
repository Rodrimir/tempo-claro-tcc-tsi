package com.rodrigo.backend2java.repository;

import com.rodrigo.backend2java.model.Habito;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class HabitoRepository {

        private static final String FIND_ALL_BY_USUARIO_ID = "SELECT * FROM habitos WHERE usuario_id = ? AND ativo = true";

        private static final String FIND_BY_ID = "SELECT * FROM habitos WHERE id = ?";

        private static final String INSERT_HABITO = "INSERT INTO habitos (id, usuario_id, titulo, categoria, gatilho_ancora, tipo_medida, "
                        +
                        "modalidade, horario_agendado, meta_base, meta_frequencia_diaria, intervalo_minutos, ativo, criado_em) "
                        +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        private static final String UPDATE_HABITO = "UPDATE habitos SET titulo = ?, meta_base = ?, ativo = ? WHERE id = ?";

        private static final String ARCHIVE_HABITO = "UPDATE habitos SET ativo = false WHERE id = ?";

        private final JdbcTemplate jdbcTemplate;

        // @audit-ok [Dashboard — RowMapper mapeia cada linha do ResultSet para a
        // entidade Habito]
        private final RowMapper<Habito> rowMapper = (rs, rowNum) -> Habito.builder()
                        .id(rs.getObject("id", UUID.class))
                        .usuarioId(rs.getObject("usuario_id", UUID.class))
                        .titulo(rs.getString("titulo"))
                        .categoria(rs.getString("categoria"))
                        .gatilhoAncora(rs.getString("gatilho_ancora"))
                        .tipoMedida(rs.getString("tipo_medida"))
                        .modalidade(rs.getString("modalidade"))
                        .horarioAgendado(rs.getObject("horario_agendado", LocalTime.class))
                        .metaBase(rs.getInt("meta_base"))
                        .metaFrequenciaDiaria(rs.getInt("meta_frequencia_diaria"))
                        .intervaloMinutos(rs.getObject("intervalo_minutos") != null ? rs.getInt("intervalo_minutos")
                                        : null)
                        .ativo(rs.getBoolean("ativo"))
                        .criadoEm(rs.getObject("criado_em", OffsetDateTime.class))
                        .build();

        // @audit-ok [Dashboard — retorna apenas hábitos com ativo=true do usuário]
        public List<Habito> findAllByUsuarioId(UUID usuarioId) {
                return jdbcTemplate.query(FIND_ALL_BY_USUARIO_ID, rowMapper, usuarioId);
        }

        public Optional<Habito> findById(UUID id) {
                return jdbcTemplate.query(FIND_BY_ID, rowMapper, id)
                                .stream()
                                .findFirst();
        }

        // @audit-ok [Criar Hábito — INSERT com todos os campos do hábito; UUID gerado
        // pelo serviço]
        public void save(Habito habito) {
                jdbcTemplate.update(INSERT_HABITO,
                                habito.getId() != null ? habito.getId() : UUID.randomUUID(),
                                habito.getUsuarioId(),
                                habito.getTitulo(),
                                habito.getCategoria(),
                                habito.getGatilhoAncora(),
                                habito.getTipoMedida(),
                                habito.getModalidade(),
                                habito.getHorarioAgendado(),
                                habito.getMetaBase(),
                                habito.getMetaFrequenciaDiaria(),
                                habito.getIntervaloMinutos(),
                                habito.getAtivo(),
                                habito.getCriadoEm());
        }

        public void update(Habito habito) {
                jdbcTemplate.update(UPDATE_HABITO, habito.getTitulo(), habito.getMetaBase(), habito.getAtivo(),
                                habito.getId());
        }

        // @audit-ok [Deletar Hábito — soft delete: seta ativo=false preservando
        // histórico]
        public void archive(UUID id) {
                jdbcTemplate.update(ARCHIVE_HABITO, id);
        }
}
