package com.rodrigo.backend2java.execucao.model;
import com.rodrigo.backend2java.habito.model.Habito;
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

    @Builder.Default
    @Column(name = "sta_valor_acumulado_hoje")
    private Integer valorAcumuladoHoje = 0;

    @Builder.Default
    @Column(name = "sta_moedas_creditadas_hoje")
    private Integer moedasCreditadasHoje = 0;

    @Column(name = "sta_proximo_vencimento")
    private OffsetDateTime proximoVencimento;

    @Builder.Default
    @Column(name = "sta_bloqueio_usado_hoje")
    private Boolean bloqueioUsadoHoje = false;

    @Builder.Default
    @Column(name = "sta_nivel_avatar")
    private Integer nivelAvatar = 1;

    @Column(name = "sta_ultimo_reset")
    private LocalDate ultimoReset;
}
