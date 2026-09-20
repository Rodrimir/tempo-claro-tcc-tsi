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


    @Column(name = "hab_meta_base")
    private Integer metaBase;

    @Column(name = "hab_meta_maxima")
    private Integer metaMaxima;

    @Column(name = "hab_incremento")
    private Integer incremento;

    @Column(name = "hab_dias_incremento")
    private Integer diasIncremento;

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
