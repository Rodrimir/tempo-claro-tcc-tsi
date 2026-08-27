package com.rodrigo.backend2java.model;
import lombok.Data;
import lombok.Builder;
import java.util.UUID;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

// @audit-ok [Schema v2.1, tabela calibracao_respostas — respostas do
// questionário "Medir Dificuldade" (RF20, D4: trabalho futuro). Só para não
// perder o desenho da tabela; sem uso em nenhum service.]
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CalibracaoResposta {

    private UUID id;
    private UUID calibracaoId;
    private String perguntaCodigo;
    private String resposta;
}
