package com.rodrigo.backend2java.calibracao;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Builder;
import java.util.UUID;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

// Tabela calibracao_respostas — a resposta crua de cada pergunta, guardada pelo
// CÓDIGO da pergunta (DIAS_SEMANA, EXPERIENCIA_PREVIA...), nunca pelo enunciado.
// É o que permite recalcular uma sugestão antiga quando os moldes do catálogo
// mudarem, em vez de só guardar o resultado já mastigado.
@Entity
@Table(name = "calibracao_respostas")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class CalibracaoResposta {

    @Id
    @Column(name = "cal_id")
    private UUID id;

    @Column(name = "cal_calibracao_id")
    private UUID calibracaoId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cal_calibracao_id", insertable = false, updatable = false)
    private Calibracao calibracao;

    @Column(name = "cal_pergunta_codigo")
    private String perguntaCodigo;

    @Column(name = "cal_resposta")
    private String resposta;
}
