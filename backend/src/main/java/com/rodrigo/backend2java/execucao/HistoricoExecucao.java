package com.rodrigo.backend2java.execucao;
import com.rodrigo.backend2java.habito.Habito;
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
import java.time.LocalDate;
import java.time.OffsetDateTime;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "historico_execucoes")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class HistoricoExecucao {

    @Id
    @Column(name = "his_id")
    private UUID id;

    @Column(name = "his_habito_id")
    private UUID habitoId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "his_habito_id", insertable = false, updatable = false)
    private Habito habito;

    // Ocorrência que esta execução cobriu. É o que permite ratear as moedas por
    // sub-atividade executada no fechamento do dia (RF12). ON DELETE SET NULL:
    // reconfigurar o hábito apaga e recria as sub_atividades, e o histórico
    // sobrevive a isso com a referência zerada.
    @Column(name = "his_sub_atividade_id")
    private UUID subAtividadeId;

    @Column(name = "his_execution_token")
    private UUID executionToken;

    @Builder.Default
    @Column(name = "his_data_hora")
    private OffsetDateTime dataHoraExecucao = OffsetDateTime.now();

    // Data no fuso do DONO do hábito, nunca a da JVM (que é UTC no Render: às
    // 21h no Brasil a execução cairia no dia seguinte e deslocaria o gráfico).
    // Quem grava resolve o fuso com ZonaUsuario.resolver e passa o valor; o
    // default existe só porque a coluna é NOT NULL sem DEFAULT no banco.
    @Builder.Default
    @Column(name = "his_data_local")
    private LocalDate dataLocal = LocalDate.now();

    @Column(name = "his_valor_realizado")
    private Integer valorRealizado;

    @Builder.Default
    @Column(name = "his_moedas_ganhas")
    private Integer moedasGanhas = 0;

    @Column(name = "his_tipo_sucesso")
    private String tipoSucesso;
}
