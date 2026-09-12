package com.rodrigo.backend2java.calibracao;

import java.util.List;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

/**
 * As respostas do questionário, na ordem em que o app as coletou.
 *
 * <p>O formato de {@code valor} depende do tipo da pergunta no catálogo:
 * <ul>
 *   <li>{@code ESCOLHA_UNICA} e {@code RITMO} — o {@code valor} da opção escolhida
 *       ("ATE_10", "EQUILIBRADO");</li>
 *   <li>{@code DIAS_SEMANA} — a máscara de 7 posições, domingo a sábado
 *       ("0111110" = segunda a sexta);</li>
 *   <li>{@code VEZES_AO_DIA} — o número ("3");</li>
 *   <li>{@code HORARIOS} — os horários separados por vírgula ("07:00,19:00").</li>
 * </ul>
 */
public record CalibracaoRequestDTO(
        @NotBlank(message = "Informe a categoria do hábito") String categoria,
        @NotEmpty(message = "Informe as respostas do questionário") @Valid List<RespostaDTO> respostas) {

    public record RespostaDTO(
            @NotBlank(message = "Informe o código da pergunta") String pergunta_codigo,
            @NotBlank(message = "Informe a resposta") String valor) {
    }
}
