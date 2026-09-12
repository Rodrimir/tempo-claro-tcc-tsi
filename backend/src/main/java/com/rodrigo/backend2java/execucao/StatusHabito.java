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
import java.util.UUID;
import lombok.Builder;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "status_habitos")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class StatusHabito {

    @Id
    @Column(name = "sta_habito_id")
    private UUID habitoId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sta_habito_id", insertable = false, updatable = false)
    private Habito habito;

    @Builder.Default
    @Column(name = "sta_moedas_locais")
    private Integer moedasLocais = 0;

    @Builder.Default
    @Column(name = "sta_bloqueios_acumulados")
    private Integer bloqueiosAcumulados = 0;

    @Builder.Default
    @Column(name = "sta_dias_seguidos")
    private Integer diasSeguidos = 0;

    @Builder.Default
    @Column(name = "sta_execucoes_hoje")
    private Integer execucoesHoje = 0;

    // Soma do realizado no dia local. É a base da avaliação da meta na janela
    // 00:00-23:59 (RF07) e do crédito diferido de moedas (RF11/RF12) — a coluna
    // existia no schema desde a v2.1, mas nenhum código a lia ou escrevia.
    @Builder.Default
    @Column(name = "sta_valor_acumulado_hoje")
    private Integer valorAcumuladoHoje = 0;

    @Column(name = "sta_proximo_vencimento")
    private OffsetDateTime proximoVencimento;

    @Builder.Default
    @Column(name = "sta_bloqueio_usado_hoje")
    private Boolean bloqueioUsadoHoje = false;

    // Espelha o DEFAULT 1 de sta_nivel_avatar (CHECK >= 1 no schema, sem teto —
    // o teto é regra de serviço, aplicado em FechamentoService, não no banco,
    // pra permitir expandir sem migração). RF14: sobe a cada 10 dias seguidos.
    @Builder.Default
    @Column(name = "sta_nivel_avatar")
    private Integer nivelAvatar = 1;

    // Último dia LOCAL já apurado pelo fechamento. Null significa "nunca
    // apurado". Tudo entre esta data e ontem ainda está pendente de apuração —
    // é assim que dias em que o usuário sumiu são fechados retroativamente.
    @Column(name = "sta_ultimo_reset")
    private LocalDate ultimoReset;
}
