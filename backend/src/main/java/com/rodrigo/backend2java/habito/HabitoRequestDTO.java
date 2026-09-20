package com.rodrigo.backend2java.habito;
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
        @NotBlank(message = "O título é obrigatório") @Size(max = 60, message = "O título pode ter no máximo 60 caracteres") String titulo,

        String categoria,

        @NotNull(message = "A meta base é obrigatória") @Min(value = 1, message = "A meta base deve ser maior que zero") Integer meta_base,

        @NotBlank(message = "O tipo de medida é obrigatório") String tipo_medida,

        @Deprecated String modalidade,

        @Min(value = 1, message = "Vezes ao dia deve ser pelo menos 1") @Max(value = 12, message = "Vezes ao dia não pode passar de 12") Integer meta_frequencia_diaria,

        @Size(max = 120, message = "O gatilho pode ter no máximo 120 caracteres") String gatilho_ancora,
        LocalTime horario_agendado,

        Integer meta_maxima,
        @Min(value = 0, message = "O incremento não pode ser negativo") Integer incremento,
        @Min(value = 1, message = "O incremento deve se repetir a cada 1 dia ou mais") Integer dias_incremento,

        @Pattern(regexp = "^[01]{7}$", message = "A frequência semanal deve ter 7 dígitos, cada um 0 ou 1") String frequencia_semanal,

        List<OcorrenciaRequestDTO> ocorrencias,

        UUID calibracao_id) {

    public record OcorrenciaRequestDTO(LocalTime horario_inicio, LocalTime horario_fim) {
    }
}
