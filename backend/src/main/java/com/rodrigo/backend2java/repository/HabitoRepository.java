package com.rodrigo.backend2java.repository;
import java.util.UUID;
import java.util.List;
import java.util.Optional;
import java.time.OffsetDateTime;
import lombok.RequiredArgsConstructor;
import com.rodrigo.backend2java.model.Habito;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;
import org.springframework.jdbc.core.JdbcTemplate;

// @audit-ok [Schema v2.1 — tabela habitos agora usa prefixo hab_*.
//
// GAP CONHECIDO (E0.5.3): três campos do model Habito.java / dos DTOs não têm
// mais coluna correspondente na tabela habitos do schema v2.1:
//   - horarioAgendado  — o schema move o horário para sub_atividades
//     (sub_horario_inicio/sub_horario_fim), uma linha por ocorrência do dia.
//   - metaFrequenciaDiaria — no schema v2.1 deixa de ser uma coluna e passa a
//     ser derivada por COUNT(sub_atividades) (ver vw_habito_hoje). Continua
//     existindo no model com @Builder.Default = 1, mas esse RowMapper não a
//     lê mais do banco — todo hábito volta do banco com o valor padrão 1.
//   - intervaloMinutos — não tem substituto em nenhuma tabela do schema v2.1.
//     Fica só no model/DTO, sempre null ao ler do banco.
// Item 2/6 da tarefa pedem para NÃO renomear/remover esses campos do model
// nem dos DTOs (contrato com o front continua igual) — então eles continuam
// declarados, só não são mais persistidos por este repository até a E0.5.5
// (criação de sub_atividades) dar a eles uma fonte de dado de verdade.
// GamificacaoService.processarExecucao usa habito.getMetaFrequenciaDiaria()
// para decidir quando fechar a ofensiva do dia — com essa mudança, todo
// hábito passa a fechar a ofensiva na 1ª execução do dia, não importa quantas
// vezes o front pediu. Repare nisso ao testar a Etapa 1 adiante.]
@Repository
@RequiredArgsConstructor
public class HabitoRepository {

        private static final String FIND_ALL_BY_USUARIO_ID = "SELECT * FROM habitos WHERE hab_usuario_id = ? AND hab_ativo = true";

        // @audit-ok [Fechamento Diário (1) — varre todos os hábitos ativos de todos os
        // usuários; o job precisa apurar a virada de dia fuso a fuso]
        private static final String FIND_ALL_ATIVOS = "SELECT * FROM habitos WHERE hab_ativo = true";

        private static final String FIND_BY_ID = "SELECT * FROM habitos WHERE hab_id = ?";

        // hab_meta_maxima, hab_incremento, hab_dias_incremento e hab_frequencia_semanal
        // não são passados aqui — todos têm DEFAULT no schema (NULL, 0, 10 e
        // '1111111' respectivamente) e nenhum fluxo de negócio atual os preenche.
        private static final String INSERT_HABITO = "INSERT INTO habitos (hab_id, hab_usuario_id, hab_titulo, hab_categoria, hab_gatilho_ancora, "
                        +
                        "hab_tipo_medida, hab_modalidade, hab_meta_base, hab_ativo, hab_criado_em) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        // @audit-ok [E2.9 pendente — UPDATE_HABITO só atualiza titulo/meta_base/ativo,
        // embora HabitoRequestDTO tenha 9 campos. Divergência pré-existente (já
        // sinalizada no MAPA_DO_CODIGO.md), mantida deliberadamente fora do escopo
        // desta tarefa — só os nomes de coluna foram atualizados para hab_*.]
        private static final String UPDATE_HABITO = "UPDATE habitos SET hab_titulo = ?, hab_meta_base = ?, hab_ativo = ? WHERE hab_id = ?";

        // hab_arquivado_em é novo no schema v2.1 — carimba quando o soft delete
        // aconteceu, além de manter hab_ativo = false.
        private static final String ARCHIVE_HABITO = "UPDATE habitos SET hab_ativo = false, hab_arquivado_em = CURRENT_TIMESTAMP WHERE hab_id = ?";

        private final JdbcTemplate jdbcTemplate;

        // @audit-ok [Dashboard — RowMapper mapeia cada linha do ResultSet para a
        // entidade Habito. horarioAgendado, metaFrequenciaDiaria e intervaloMinutos
        // não são lidos aqui — ver comentário no topo do arquivo.]
        private final RowMapper<Habito> rowMapper = (rs, rowNum) -> Habito.builder()
                        .id(rs.getObject("hab_id", UUID.class))
                        .usuarioId(rs.getObject("hab_usuario_id", UUID.class))
                        .titulo(rs.getString("hab_titulo"))
                        .categoria(rs.getString("hab_categoria"))
                        .gatilhoAncora(rs.getString("hab_gatilho_ancora"))
                        .tipoMedida(rs.getString("hab_tipo_medida"))
                        .modalidade(rs.getString("hab_modalidade"))
                        .metaBase(rs.getInt("hab_meta_base"))
                        .ativo(rs.getBoolean("hab_ativo"))
                        .criadoEm(rs.getObject("hab_criado_em", OffsetDateTime.class))
                        .build();

        // @audit-ok [Dashboard — retorna apenas hábitos com ativo=true do usuário]
        public List<Habito> findAllByUsuarioId(UUID usuarioId) {
                return jdbcTemplate.query(FIND_ALL_BY_USUARIO_ID, rowMapper, usuarioId);
        }

        // @audit-ok [Fechamento Diário (1) — todos os hábitos ativos, de todos os usuários]
        public List<Habito> findAllAtivos() {
                return jdbcTemplate.query(FIND_ALL_ATIVOS, rowMapper);
        }

        public Optional<Habito> findById(UUID id) {
                return jdbcTemplate.query(FIND_BY_ID, rowMapper, id)
                                .stream()
                                .findFirst();
        }

        // @audit-ok [Criar Hábito — INSERT com os campos do hábito que têm coluna em
        // habitos no schema v2.1; UUID gerado pelo serviço]
        public void save(Habito habito) {
                jdbcTemplate.update(INSERT_HABITO,
                                habito.getId() != null ? habito.getId() : UUID.randomUUID(),
                                habito.getUsuarioId(),
                                habito.getTitulo(),
                                habito.getCategoria(),
                                habito.getGatilhoAncora(),
                                habito.getTipoMedida(),
                                habito.getModalidade(),
                                habito.getMetaBase(),
                                habito.getAtivo(),
                                habito.getCriadoEm());
        }

        public void update(Habito habito) {
                jdbcTemplate.update(UPDATE_HABITO, habito.getTitulo(), habito.getMetaBase(), habito.getAtivo(),
                                habito.getId());
        }

        // @audit-ok [Deletar Hábito — soft delete: seta ativo=false preservando
        // histórico, e agora também carimba hab_arquivado_em]
        public void archive(UUID id) {
                jdbcTemplate.update(ARCHIVE_HABITO, id);
        }
}
