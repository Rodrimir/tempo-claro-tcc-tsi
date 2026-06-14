// @audit-ok: BACKEND-StatusHabitoRepository.java-01
package com.rodrigo.backend2java.repository;

import com.rodrigo.backend2java.model.StatusHabito;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
@RequiredArgsConstructor
public class StatusHabitoRepository {

    private static final String FIND_BY_HABITO_ID = 
            "SELECT * FROM status_habitos WHERE habito_id = ?";
            
    private static final String INSERT_STATUS = 
            "INSERT INTO status_habitos (habito_id, moedas_locais, bloqueios_acumulados, dias_seguidos, " +
            "execucoes_hoje, proximo_vencimento, bloqueio_usado_hoje) " +
            "VALUES (?, ?, ?, ?, ?, ?, ?)";
            
    private static final String UPDATE_STATUS = 
            "UPDATE status_habitos SET moedas_locais = ?, bloqueios_acumulados = ?, dias_seguidos = ?, " +
            "execucoes_hoje = ?, proximo_vencimento = ?, bloqueio_usado_hoje = ? WHERE habito_id = ?";

    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<StatusHabito> rowMapper = (rs, rowNum) -> StatusHabito.builder()
            .habitoId(rs.getObject("habito_id", UUID.class))
            .moedasLocais(rs.getInt("moedas_locais"))
            .bloqueiosAcumulados(rs.getInt("bloqueios_acumulados"))
            .diasSeguidos(rs.getInt("dias_seguidos"))
            .execucoesHoje(rs.getInt("execucoes_hoje"))
            .proximoVencimento(rs.getObject("proximo_vencimento", OffsetDateTime.class))
            .bloqueioUsadoHoje(rs.getBoolean("bloqueio_usado_hoje"))
            .build();

    public Optional<StatusHabito> findById(UUID habitoId) {
        return jdbcTemplate.query(FIND_BY_HABITO_ID, rowMapper, habitoId)
                .stream()
                .findFirst();
    }

    public void save(StatusHabito status) {
        jdbcTemplate.update(INSERT_STATUS,
                status.getHabitoId(),
                status.getMoedasLocais(),
                status.getBloqueiosAcumulados(),
                status.getDiasSeguidos(),
                status.getExecucoesHoje(),
                status.getProximoVencimento(),
                status.getBloqueioUsadoHoje()
        );
    }

    public void update(StatusHabito status) {
        jdbcTemplate.update(UPDATE_STATUS,
                status.getMoedasLocais(),
                status.getBloqueiosAcumulados(),
                status.getDiasSeguidos(),
                status.getExecucoesHoje(),
                status.getProximoVencimento(),
                status.getBloqueioUsadoHoje(),
                status.getHabitoId()
        );
    }
}
