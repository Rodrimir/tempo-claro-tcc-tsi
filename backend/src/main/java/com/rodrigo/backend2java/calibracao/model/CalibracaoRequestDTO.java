package com.rodrigo.backend2java.calibracao.model;

import java.util.List;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

public record CalibracaoRequestDTO(
        @NotBlank(message = "{validacao.calibracao.categoria}") String categoria,
        @NotEmpty(message = "{validacao.calibracao.respostas}") @Valid List<RespostaDTO> respostas) {

    public record RespostaDTO(
            @NotBlank(message = "{validacao.calibracao.pergunta}") String pergunta_codigo,
            @NotBlank(message = "{validacao.calibracao.resposta}") String valor) {
    }
}
