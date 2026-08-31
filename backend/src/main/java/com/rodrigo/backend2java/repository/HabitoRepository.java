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
// GAP CONHECIDO (E0.5.3, revisado na E2.9): dois campos do model Habito.java
// não têm mais coluna correspondente na tabela habitos do schema v2.1:
//   - horarioAgendado  — o schema move o horário para sub_atividades
//     (sub_horario_inicio/sub_horario_fim), uma linha por ocorrência do dia.
//   - metaFrequenciaDiaria — no schema v2.1 deixa de ser uma coluna e passa a
//     ser derivada por COUNT(sub_atividades) (ver vw_habito_hoje). Continua
//     existindo no model com @Builder.Default = 1, mas esse RowMapper não a
//     lê mais do banco — todo hábito volta do banco com o valor padrão 1.
// (Um terceiro campo, intervaloMinutos, também não tinha coluna — mas
// diferente destes dois, nunca teve um substituto real em nenhuma tabela.
// A E2.9 removeu esse campo do model e dos DTOs inteiramente, em vez de
// mantê-lo como uma promessa que nada cumpre — ver docs/CONTRATO_API.md.)
// horarioAgendado/metaFrequenciaDiaria continuam declarados de propósito
// (contrato com o front não muda) — não são mais persistidos por este
// repository desde que sub_atividades (E0.5.5) virou a fonte de dado real.
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

        // @audit-ok [E2.3/E2.4 — hab_meta_maxima/hab_incremento/hab_dias_incremento/
        // hab_frequencia_semanal entram no INSERT agora. Antes ficavam de fora e o
        // DEFAULT do schema (NULL, 0, 10, '1111111') resolvia sozinho; agora que o
        // valor pode vir do request, o default equivalente precisa ser aplicado em
        // Java antes de chegar aqui (ver HabitoService.criarHabito) — todas essas
        // colunas, exceto hab_meta_maxima, são NOT NULL: um bind nulo explícito
        // quebraria o INSERT em vez de cair no DEFAULT da coluna.]
        private static final String INSERT_HABITO = "INSERT INTO habitos (hab_id, hab_usuario_id, hab_titulo, hab_categoria, hab_gatilho_ancora, "
                        +
                        "hab_tipo_medida, hab_modalidade, hab_meta_base, hab_meta_maxima, hab_incremento, hab_dias_incremento, hab_frequencia_semanal, hab_ativo, hab_criado_em) "
                        +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        // @audit-ok [E2.9 (item 4) — antes só atualizava titulo/meta_base/ativo,
        // embora HabitoRequestDTO já tivesse crescido pra 13 campos (E2.3 a E2.8
        // foram todas adicionando campos ao request sem que este UPDATE
        // acompanhasse) — divergência sinalizada desde o MAPA_DO_CODIGO.md e
        // citada pelo nome desta própria tarefa ("E2.9 pendente") no comentário
        // antigo. Agora cobre os mesmos campos editáveis que INSERT_HABITO grava
        // na criação — hab_id/hab_usuario_id/hab_criado_em continuam de fora
        // porque não fazem sentido mudar numa edição.]
        private static final String UPDATE_HABITO = "UPDATE habitos SET hab_titulo = ?, hab_categoria = ?, hab_gatilho_ancora = ?, "
                        +
                        "hab_tipo_medida = ?, hab_modalidade = ?, hab_meta_base = ?, hab_meta_maxima = ?, hab_incremento = ?, "
                        +
                        "hab_dias_incremento = ?, hab_frequencia_semanal = ?, hab_ativo = ? WHERE hab_id = ?";

        // hab_arquivado_em é novo no schema v2.1 — carimba quando o soft delete
        // aconteceu, além de manter hab_ativo = false.
        private static final String ARCHIVE_HABITO = "UPDATE habitos SET hab_ativo = false, hab_arquivado_em = CURRENT_TIMESTAMP WHERE hab_id = ?";

        private final JdbcTemplate jdbcTemplate;

        // @audit-ok [Dashboard — RowMapper mapeia cada linha do ResultSet para a
        // entidade Habito. horarioAgendado e metaFrequenciaDiaria não são lidos
        // aqui — ver comentário no topo do arquivo.]
        private final RowMapper<Habito> rowMapper = (rs, rowNum) -> Habito.builder()
                        .id(rs.getObject("hab_id", UUID.class))
                        .usuarioId(rs.getObject("hab_usuario_id", UUID.class))
                        .titulo(rs.getString("hab_titulo"))
                        .categoria(rs.getString("hab_categoria"))
                        .gatilhoAncora(rs.getString("hab_gatilho_ancora"))
                        .tipoMedida(rs.getString("hab_tipo_medida"))
                        .modalidade(rs.getString("hab_modalidade"))
                        .metaBase(rs.getInt("hab_meta_base"))
                        // @audit-ok [E2.3 — hab_meta_maxima é nullable; getObject com o tipo
                        // explícito devolve null de verdade em vez de 0 (getInt faria isso).]
                        .metaMaxima(rs.getObject("hab_meta_maxima", Integer.class))
                        .incremento(rs.getInt("hab_incremento"))
                        .diasIncremento(rs.getInt("hab_dias_incremento"))
                        .frequenciaSemanal(rs.getString("hab_frequencia_semanal"))
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
                                habito.getMetaMaxima(),
                                habito.getIncremento(),
                                habito.getDiasIncremento(),
                                habito.getFrequenciaSemanal(),
                                habito.getAtivo(),
                                habito.getCriadoEm());
        }

        public void update(Habito habito) {
                jdbcTemplate.update(UPDATE_HABITO,
                                habito.getTitulo(),
                                habito.getCategoria(),
                                habito.getGatilhoAncora(),
                                habito.getTipoMedida(),
                                habito.getModalidade(),
                                habito.getMetaBase(),
                                habito.getMetaMaxima(),
                                habito.getIncremento(),
                                habito.getDiasIncremento(),
                                habito.getFrequenciaSemanal(),
                                habito.getAtivo(),
                                habito.getId());
        }

        // @audit-ok [Deletar Hábito — soft delete: seta ativo=false preservando
        // histórico, e agora também carimba hab_arquivado_em]
        public void archive(UUID id) {
                jdbcTemplate.update(ARCHIVE_HABITO, id);
        }
}
