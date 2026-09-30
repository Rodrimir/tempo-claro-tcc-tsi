package com.rodrigo.backend2java.calibracao;

import java.util.List;
import lombok.Builder;

@Builder
public record QuestionarioResponseDTO(
        String categoria,
        String tipo_medida,
        String unidade,
        Integer versao_catalogo,
        List<PerguntaDTO> perguntas) {

    @Builder
    public record PerguntaDTO(
            String codigo,
            String tipo,
            String enunciado,
            Integer maximo,
            List<OpcaoDTO> opcoes) {
    }

    @Builder
    public record OpcaoDTO(
            String valor,
            String rotulo,
            String detalhe) {
    }
}
