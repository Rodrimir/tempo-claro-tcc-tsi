package com.rodrigo.backend2java.calibracao;

import java.util.List;
import java.util.UUID;
import lombok.Builder;
import java.time.LocalTime;

/**
 * A sugestão calculada a partir das respostas.
 *
 * <p>{@code sugestao} traz exatamente os campos que o Passo 3 do assistente
 * preencheria à mão — aceitar a sugestão é só pré-preencher aquele formulário, que
 * continua editável. Nada aqui cria hábito nenhum: quem cria é
 * {@code POST /habits}, levando o {@code calibracao_id} junto.
 */
@Builder
public record CalibracaoResponseDTO(
        UUID calibracao_id,
        /** Soma dos pesos das respostas — devolvida para a tela poder explicar. */
        Integer pontuacao,
        SugestaoDTO sugestao,
        /** Frase em linguagem não punitiva explicando de onde saiu a sugestão. */
        String explicacao) {

    @Builder
    public record SugestaoDTO(
            String categoria,
            String tipo_medida,
            String unidade,
            Integer meta_base,
            Integer meta_maxima,
            Integer incremento,
            Integer dias_incremento,
            Integer meta_frequencia_diaria,
            String frequencia_semanal,
            List<OcorrenciaSugeridaDTO> ocorrencias) {
    }

    @Builder
    public record OcorrenciaSugeridaDTO(
            LocalTime horario_inicio,
            Integer alvo) {
    }
}
