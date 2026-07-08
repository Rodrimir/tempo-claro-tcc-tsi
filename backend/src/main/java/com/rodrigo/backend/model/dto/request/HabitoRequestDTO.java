package com.rodrigo.backend.model.dto.request;

import lombok.Builder;
import java.util.List;
import java.time.LocalTime;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import com.rodrigo.backend.model.dto.SubAtividadeDTO;

// @audit-ok [Criar Hábito(1REQ) — request DTO do wizard de criação: POST /api/habits]

@Builder
public record HabitoRequestDTO(

        @NotBlank(message = "O título é obrigatório") String titulo,

        @NotBlank(message = "A categoria é obrigatória") String categoria_codigo,

        @NotNull(message = "A meta base é obrigatória") @Min(value = 1, message = "A meta base deve ser maior que zero") Integer meta_base,

        @NotBlank(message = "O tipo de medida é obrigatório") String tipo_medida,

        String gatilho_ancora,
        LocalTime horario_agendado,
        Integer meta_maxima,
        Integer dias_para_aumento,
        Integer incremento_meta,

        List<SubAtividadeDTO> sub_atividades,
        List<Integer> dias_semana) {
}
