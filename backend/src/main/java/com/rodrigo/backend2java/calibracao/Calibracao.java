package com.rodrigo.backend2java.calibracao;
import com.rodrigo.backend2java.habito.Habito;
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
import lombok.Builder;
import java.util.UUID;
import java.time.OffsetDateTime;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * Uma rodada do questionário "Medir Dificuldade" (RF20/RNF04) e a sugestão que ela
 * produziu.
 *
 * <p>Pertence ao <b>usuário</b>, não ao hábito: a calibração é o Passo 2 do
 * assistente e acontece antes de o hábito existir. {@code habitoId} só é preenchido
 * se a sugestão virar um hábito de verdade — e é o que permite, depois, comparar
 * "o que foi sugerido" com "o que a pessoa de fato manteve" para afinar os moldes.
 */
@Entity
@Table(name = "calibracoes")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class Calibracao {

    @Id
    @Column(name = "cab_id")
    private UUID id;

    @Column(name = "cab_usuario_id")
    private UUID usuarioId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cab_usuario_id", insertable = false, updatable = false)
    private Usuario usuario;

    @Column(name = "cab_categoria")
    private String categoria;

    /** Null até a sugestão ser aceita e virar hábito. */
    @Column(name = "cab_habito_id")
    private UUID habitoId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cab_habito_id", insertable = false, updatable = false)
    private Habito habito;

    /** Versão do catálogo usada — permite reinterpretar respostas antigas. */
    @Builder.Default
    @Column(name = "cab_versao_catalogo")
    private Integer versaoCatalogo = 1;

    /** Soma dos pesos das respostas: o "ranking" que escolhe a faixa de meta. */
    @Builder.Default
    @Column(name = "cab_pontuacao")
    private Integer pontuacao = 0;

    @Column(name = "cab_meta_sugerida")
    private Integer metaSugerida;

    @Column(name = "cab_meta_maxima_sugerida")
    private Integer metaMaximaSugerida;

    @Builder.Default
    @Column(name = "cab_incremento_sugerido")
    private Integer incrementoSugerido = 0;

    @Builder.Default
    @Column(name = "cab_dias_incremento_sugerido")
    private Integer diasIncrementoSugerido = 10;

    @Builder.Default
    @Column(name = "cab_vezes_ao_dia_sugerida")
    private Integer vezesAoDiaSugerida = 1;

    @Builder.Default
    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "cab_frequencia_semanal_sugerida", length = 7)
    private String frequenciaSemanalSugerida = "1111111";

    @Builder.Default
    @Column(name = "cab_aceita")
    private Boolean aceita = false;

    @Builder.Default
    @Column(name = "cab_criado_em")
    private OffsetDateTime criadoEm = OffsetDateTime.now();
}
