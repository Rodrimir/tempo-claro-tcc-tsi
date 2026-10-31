package com.rodrigo.backend2java.habito.model;
import java.util.List;
import java.util.UUID;
import lombok.Builder;
import java.time.LocalTime;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Builder
public record HabitoRequestDTO(
        @NotBlank(message = "{validacao.titulo.obrigatorio}") @Size(max = 60, message = "{validacao.titulo.tamanho}") String titulo,

        String categoria,

        @NotNull(message = "{validacao.metaBase.obrigatoria}") @Min(value = 1, message = "{validacao.metaBase.minima}") Integer meta_base,

        @NotBlank(message = "{validacao.tipoMedida.obrigatorio}") String tipo_medida,

        @Min(value = 1, message = "{validacao.vezesAoDia.minimo}") @Max(value = 12, message = "{validacao.vezesAoDia.maximo}") Integer meta_frequencia_diaria,

        @Size(max = 120, message = "{validacao.gatilho.tamanho}") String gatilho_ancora,
        LocalTime horario_agendado,

        Integer meta_maxima,
        @Min(value = 0, message = "{validacao.incremento.negativo}") Integer incremento,
        @Min(value = 1, message = "{validacao.diasIncremento.minimo}") Integer dias_incremento,

        @Pattern(regexp = "^[01]{7}$", message = "{validacao.frequencia.formato}") String frequencia_semanal,

        List<OcorrenciaRequestDTO> ocorrencias,

        UUID calibracao_id) {

    public record OcorrenciaRequestDTO(LocalTime horario_inicio, LocalTime horario_fim) {
    }
}
