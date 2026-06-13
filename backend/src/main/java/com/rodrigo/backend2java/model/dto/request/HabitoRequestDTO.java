package com.rodrigo.backend2java.model.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalTime;
import lombok.Builder;

@Builder
public record HabitoRequestDTO(
    @NotBlank(message = "O título é obrigatório")
    String titulo,
    
    String categoria,
    
    @NotNull(message = "A meta base é obrigatória")
    @Min(value = 1, message = "A meta base deve ser maior que zero")
    Integer meta_base,
    
    @NotBlank(message = "O tipo de medida é obrigatório")
    String tipo_medida,
    
    @NotBlank(message = "A modalidade é obrigatória")
    String modalidade,
    
    Integer meta_frequencia_diaria,
    Integer intervalo_minutos,
    String gatilho_ancora,
    LocalTime horario_agendado
) {}
