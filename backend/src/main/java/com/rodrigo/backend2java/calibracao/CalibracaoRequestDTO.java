package com.rodrigo.backend2java.calibracao;

import java.util.List;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

public record CalibracaoRequestDTO(
        @NotBlank(message = "Informe a categoria do hábito") String categoria,
        @NotEmpty(message = "Informe as respostas do questionário") @Valid List<RespostaDTO> respostas) {

    public record RespostaDTO(
            @NotBlank(message = "Informe o código da pergunta") String pergunta_codigo,
            @NotBlank(message = "Informe a resposta") String valor) {
    }
}
