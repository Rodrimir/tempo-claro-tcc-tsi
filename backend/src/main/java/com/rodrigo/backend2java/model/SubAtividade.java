package com.rodrigo.backend2java.model;
import lombok.Data;
import lombok.Builder;
import java.util.UUID;
import java.time.LocalTime;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

// @audit-ok [Schema v2.1, tabela sub_atividades — cada ocorrência diária do
// hábito. Criado na tarefa E0.5.3 (repositório + model), ainda sem uso em
// nenhum service: a criação de linhas na criação do hábito é a E0.5.5.]
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubAtividade {

    private UUID id;
    private UUID habitoId;
    private Integer ordem;
    private LocalTime horarioInicio;
    private LocalTime horarioFim;
    private Integer alvo;
}
