package com.rodrigo.backend2java.habito;
import com.rodrigo.backend2java.usuario.Usuario;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import lombok.Getter;
import java.util.UUID;
import lombok.Builder;
import java.time.OffsetDateTime;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "habitos")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class Habito {

    @Id
    @Column(name = "hab_id")
    private UUID id;

    @Column(name = "hab_usuario_id")
    private UUID usuarioId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hab_usuario_id", insertable = false, updatable = false)
    private Usuario usuario;

    @Column(name = "hab_titulo")
    private String titulo;

    @Column(name = "hab_categoria")
    private String categoria;

    @Column(name = "hab_gatilho_ancora")
    private String gatilhoAncora;

    @Column(name = "hab_tipo_medida")
    private String tipoMedida;

    // Schema v3.0 — hab_modalidade, horarioAgendado e metaFrequenciaDiaria saíram
    // daqui. As duas últimas eram @Transient: voltavam sempre null e 1 do banco,
    // e a segunda chegou a fechar a ofensiva na 1ª de N ocorrências (o HOTFIX
    // documentado em GamificacaoService). O horário mora em sub_atividades e a
    // frequência diária É a contagem de sub_atividades — nunca um campo próprio.

    @Column(name = "hab_meta_base")
    private Integer metaBase;

    // @audit-ok [E2.3 — progressão automática de meta (colunas hab_meta_maxima/
    // hab_incremento/hab_dias_incremento, já existentes no schema v2.1 desde a
    // E0.5.3, mas sem ligação nenhuma com o Java até agora).]
    @Column(name = "hab_meta_maxima")
    private Integer metaMaxima;

    @Column(name = "hab_incremento")
    private Integer incremento;

    @Column(name = "hab_dias_incremento")
    private Integer diasIncremento;

    // @audit-ok [E2.4 — máscara de 7 posições, domingo(posição 1)..sábado
    // (posição 7). Convenção confirmada (item 1 da tarefa): bate com
    // Date.getDay() do JS (0=Dom) e com dayOfWeek.getValue() % 7, já usado em
    // StatsService (E2.2) — ambas as pontas leem o índice 0 como domingo.]
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "hab_frequencia_semanal", length = 7)
    private String frequenciaSemanal;

    @Builder.Default
    @Column(name = "hab_ativo")
    private Boolean ativo = true;

    @Builder.Default
    @Column(name = "hab_criado_em")
    private OffsetDateTime criadoEm = OffsetDateTime.now();
}
