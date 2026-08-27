package com.rodrigo.backend2java.model;
import lombok.Data;
import lombok.Builder;
import java.util.UUID;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HistoricoExecucao {

    private UUID id;
    private UUID habitoId;
    private UUID executionToken;

    @Builder.Default
    private OffsetDateTime dataHoraExecucao = OffsetDateTime.now();

    // @audit-ok [Schema v2.1 — his_data_local é NOT NULL e sem DEFAULT no
    // banco, então precisa vir sempre preenchido daqui. Usa a data do
    // servidor como aproximação; o valor correto é a data no fuso do DONO
    // do hábito (usu_fuso_horario), mesma resolução que
    // FechamentoDiarioJob.resolverFuso já faz para outro fim. Essa
    // camada de persistência não tem acesso ao usuário aqui — GamificacaoService
    // teria que buscar o Usuario para resolver o fuso corretamente, o que fica
    // para uma tarefa futura (a mesma pendência do RF07 sobre a janela
    // 00:00-23:59 local).]
    @Builder.Default
    private LocalDate dataLocal = LocalDate.now();

    private Integer valorRealizado;

    @Builder.Default
    private Integer moedasGanhas = 0;

    private String tipoSucesso;
}
