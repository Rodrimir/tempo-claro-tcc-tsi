package com.rodrigo.backend2java.calibracao;

import java.util.List;
import lombok.Builder;

/**
 * O questionário de uma categoria, como o app deve desenhá-lo.
 *
 * <p>É o que permite trocar perguntas, rótulos e pesos editando só
 * {@code catalogo-v1.json}, sem publicar versão nova do aplicativo: a tela não
 * conhece nenhuma pergunta por nome, só sabe renderizar os cinco {@code tipo}s.
 */
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
            /** ESCOLHA_UNICA, DIAS_SEMANA, VEZES_AO_DIA, HORARIOS ou RITMO. */
            String tipo,
            String enunciado,
            /** Só em VEZES_AO_DIA: quantas ocorrências a categoria admite. */
            Integer maximo,
            List<OpcaoDTO> opcoes) {
    }

    @Builder
    public record OpcaoDTO(
            String valor,
            String rotulo,
            /** Só em RITMO: a linha que explica o efeito ("+2 minutos a cada 10 dias"). */
            String detalhe) {
    }
}
