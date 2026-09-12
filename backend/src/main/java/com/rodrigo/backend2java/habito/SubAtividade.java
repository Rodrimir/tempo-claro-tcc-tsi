package com.rodrigo.backend2java.habito;
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
import java.time.LocalTime;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

// @audit-ok [Schema v2.1, tabela sub_atividades — cada ocorrência diária do
// hábito. Criado na tarefa E0.5.3 (repositório + model), ainda sem uso em
// nenhum service: a criação de linhas na criação do hábito é a E0.5.5.]
@Entity
@Table(name = "sub_atividades")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class SubAtividade {

    @Id
    @Column(name = "sub_id")
    private UUID id;

    @Column(name = "sub_habito_id")
    private UUID habitoId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sub_habito_id", insertable = false, updatable = false)
    private Habito habito;

    @JdbcTypeCode(SqlTypes.SMALLINT)
    @Column(name = "sub_ordem")
    private Integer ordem;

    @Column(name = "sub_horario_inicio")
    private LocalTime horarioInicio;

    @Column(name = "sub_horario_fim")
    private LocalTime horarioFim;

    @Column(name = "sub_alvo")
    private Integer alvo;
}
