package com.rodrigo.backend2java.model;
import lombok.Data;
import java.util.UUID;
import lombok.Builder;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StatusHabito {

    private UUID habitoId;

    @Builder.Default
    private Integer moedasLocais = 0;

    @Builder.Default
    private Integer bloqueiosAcumulados = 0;

    @Builder.Default
    private Integer diasSeguidos = 0;

    @Builder.Default
    private Integer execucoesHoje = 0;

    private OffsetDateTime proximoVencimento;

    @Builder.Default
    private Boolean bloqueioUsadoHoje = false;

    // @audit-ok [E4.4.1 — espelha o DEFAULT 1 de sta_nivel_avatar (CHECK >= 1
    // no schema, sem teto — o limite de 50 é regra de serviço, aplicado em
    // FechamentoDiarioJob, não no banco, pra permitir expandir sem migração).]
    @Builder.Default
    private Integer nivelAvatar = 1;

    // Último dia, no fuso do usuário, em que o FechamentoDiarioJob já zerou
    // execucoesHoje e bloqueioUsadoHoje. Null significa "nunca apurado".
    private LocalDate ultimoReset;
}
