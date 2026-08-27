package com.rodrigo.backend2java.repository;
import java.util.UUID;
import java.util.Optional;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import org.springframework.jdbc.core.JdbcTemplate;
import com.rodrigo.backend2java.model.StatusHabito;
// @audit-ok [Dashboard (9) / Execução Timer (24) / Loja Escudo (14) — repositório de status de gamificação por hábito]
//
// @audit-ok [Schema v2.1 — tabela status_habitos agora usa prefixo sta_*.
// Colunas novas sta_recorde_dias, sta_valor_acumulado_hoje e sta_nivel_avatar
// não têm campo correspondente em StatusHabito.java ainda — todas têm DEFAULT
// no schema (0, 0 e 1) e ficam com esse valor até alguma tarefa futura
// precisar delas (ex.: sta_valor_acumulado_hoje serve a RF07, a avaliação da
// meta diária na janela 00:00-23:59, ainda não implementada).]
@Repository
@RequiredArgsConstructor
public class StatusHabitoRepository {

        private static final String FIND_BY_HABITO_ID = "SELECT * FROM status_habitos WHERE sta_habito_id = ?";

        private static final String INSERT_STATUS = "INSERT INTO status_habitos (sta_habito_id, sta_moedas_locais, sta_bloqueios_acumulados, sta_dias_seguidos, "
                        +
                        "sta_execucoes_hoje, sta_proximo_vencimento, sta_bloqueio_usado_hoje, sta_ultimo_reset) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

        private static final String UPDATE_STATUS = "UPDATE status_habitos SET sta_moedas_locais = ?, sta_bloqueios_acumulados = ?, sta_dias_seguidos = ?, "
                        +
                        "sta_execucoes_hoje = ?, sta_proximo_vencimento = ?, sta_bloqueio_usado_hoje = ?, sta_ultimo_reset = ? WHERE sta_habito_id = ?";

        // @audit-ok [Fechamento Diário (3) — zera os contadores diários de um hábito e
        // marca a data já apurada, no fuso do usuário]
        private static final String RESET_DIARIO = "UPDATE status_habitos SET sta_execucoes_hoje = 0, sta_bloqueio_usado_hoje = false, "
                        +
                        "sta_ultimo_reset = ? WHERE sta_habito_id = ? AND (sta_ultimo_reset IS NULL OR sta_ultimo_reset < ?)";

        private final JdbcTemplate jdbcTemplate;

        // @audit-ok [Dashboard (9) — RowMapper mapeia todos os campos de gamificação do status]
        private final RowMapper<StatusHabito> rowMapper = (rs, rowNum) -> StatusHabito.builder()
                        .habitoId(rs.getObject("sta_habito_id", UUID.class))
                        .moedasLocais(rs.getInt("sta_moedas_locais"))
                        .bloqueiosAcumulados(rs.getInt("sta_bloqueios_acumulados"))
                        .diasSeguidos(rs.getInt("sta_dias_seguidos"))
                        .execucoesHoje(rs.getInt("sta_execucoes_hoje"))
                        .proximoVencimento(rs.getObject("sta_proximo_vencimento", OffsetDateTime.class))
                        .bloqueioUsadoHoje(rs.getBoolean("sta_bloqueio_usado_hoje"))
                        .ultimoReset(rs.getObject("sta_ultimo_reset", LocalDate.class))
                        .build();

        public Optional<StatusHabito> findById(UUID habitoId) {
                return jdbcTemplate.query(FIND_BY_HABITO_ID, rowMapper, habitoId)
                                .stream()
                                .findFirst();
        }

        // @audit-ok [Criar Hábito (19) — INSERT com status zerado ao criar o hábito]
        public void save(StatusHabito status) {
                jdbcTemplate.update(INSERT_STATUS,
                                status.getHabitoId(),
                                status.getMoedasLocais(),
                                status.getBloqueiosAcumulados(),
                                status.getDiasSeguidos(),
                                status.getExecucoesHoje(),
                                status.getProximoVencimento(),
                                status.getBloqueioUsadoHoje(),
                                status.getUltimoReset());
        }

        // @audit-ok [Execução Timer (24) / Loja Escudo (14) — UPDATE completo de todos os campos de gamificação]
        public void update(StatusHabito status) {
                jdbcTemplate.update(UPDATE_STATUS,
                                status.getMoedasLocais(),
                                status.getBloqueiosAcumulados(),
                                status.getDiasSeguidos(),
                                status.getExecucoesHoje(),
                                status.getProximoVencimento(),
                                status.getBloqueioUsadoHoje(),
                                status.getUltimoReset(),
                                status.getHabitoId());
        }

        // @audit-ok [Fechamento Diário (3) — reset idempotente: a cláusula
        // "sta_ultimo_reset < hoje" garante que rodar o job várias vezes no mesmo dia
        // não zere contadores de execuções já registradas depois da virada]
        public int resetarDiario(UUID habitoId, LocalDate hojeNoFusoDoUsuario) {
                return jdbcTemplate.update(RESET_DIARIO,
                                hojeNoFusoDoUsuario,
                                habitoId,
                                hojeNoFusoDoUsuario);
        }
}
