package com.rodrigo.backend2java.repository;
import java.util.UUID;
import java.util.Optional;
import java.time.OffsetDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import org.springframework.jdbc.core.JdbcTemplate;
import com.rodrigo.backend2java.model.dto.response.HabitoResponseDTO;

// @audit-ok [E1.1 — lê vw_habito_hoje (schema v2.1) e monta o HabitoResponseDTO
// direto, sem passar por Habito/StatusHabito. Desvio deliberado do padrão
// "repository devolve model" do resto do projeto: essa view existe
// especificamente para ser a fonte única do DTO "hábito + status de hoje"
// (ver comentário na Seção 10 do schema.sql) — criar um model intermediário
// só para copiá-lo 1:1 para o DTO logo em seguida seria puro boilerplate,
// já que nenhum outro consumidor usaria esse model.
//
// horario_agendado fica sempre null aqui: nenhuma coluna de habitos o carrega
// desde o schema v2.1 (ver HabitoRepository) — superseded por
// horario_ocorrencia_atual (E2.8), que reflete o horário de verdade. ativo é
// sempre true: a view já filtra WHERE hab_ativo, então nenhuma linha inativa
// chega até aqui.
// E2.9 (item 4) — intervalo_minutos removido do DTO inteiro (nunca teve
// coluna correspondente; ver docs/CONTRATO_API.md).
@Repository
@RequiredArgsConstructor
public class HabitoHojeRepository {

    private static final String FIND_BY_HABITO_ID = "SELECT * FROM vw_habito_hoje WHERE hab_id = ?";

    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<HabitoResponseDTO> rowMapper = (rs, rowNum) -> HabitoResponseDTO.builder()
            .id(rs.getObject("hab_id", UUID.class))
            .titulo(rs.getString("hab_titulo"))
            .categoria(rs.getString("hab_categoria"))
            .tipo_medida(rs.getString("hab_tipo_medida"))
            .modalidade(rs.getString("hab_modalidade"))
            .horario_agendado(null)
            .meta_base(rs.getInt("hab_meta_base"))
            .meta_frequencia_diaria(rs.getInt("meta_frequencia_diaria"))
            .ativo(true)
            .moedas_locais(rs.getInt("sta_moedas_locais"))
            .bloqueios_acumulados(rs.getInt("sta_bloqueios_acumulados"))
            .dias_seguidos(rs.getInt("sta_dias_seguidos"))
            .execucoes_hoje(rs.getInt("sta_execucoes_hoje"))
            .proximo_vencimento(rs.getObject("sta_proximo_vencimento", OffsetDateTime.class))
            .bloqueio_usado_hoje(rs.getBoolean("sta_bloqueio_usado_hoje"))
            .status(rs.getString("status_hoje"))
            // @audit-ok [E2.3 — colunas acrescentadas ao fim de vw_habito_hoje.
            // meta_maxima é nullable (getObject com tipo explícito, não getInt).]
            .meta_maxima(rs.getObject("hab_meta_maxima", Integer.class))
            .incremento(rs.getInt("hab_incremento"))
            .dias_incremento(rs.getInt("hab_dias_incremento"))
            .frequencia_semanal(rs.getString("hab_frequencia_semanal"))
            // @audit-ok [E4.1 — coluna acrescentada ao fim de vw_habito_hoje.]
            .gatilho_ancora(rs.getString("hab_gatilho_ancora"))
            .build();

    public Optional<HabitoResponseDTO> findByHabitoId(UUID habitoId) {
        return jdbcTemplate.query(FIND_BY_HABITO_ID, rowMapper, habitoId)
                .stream()
                .findFirst();
    }
}
