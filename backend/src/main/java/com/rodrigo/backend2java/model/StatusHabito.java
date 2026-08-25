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

    // Último dia, no fuso do usuário, em que o FechamentoDiarioJob já zerou
    // execucoesHoje e bloqueioUsadoHoje. Null significa "nunca apurado".
    private LocalDate ultimoReset;
}
