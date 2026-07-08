package com.rodrigo.backend.model.dto;

import java.util.UUID;
import lombok.Builder;
import java.time.LocalTime;

// @audit-ok [Criar Hábito(1REQ/1RES) / Dashboard(1RES) — DTO compartilhado de sub-atividade; id=null em requests de criação]

@Builder
public record SubAtividadeDTO(
        UUID id,
        Integer ordem,
        Integer alvo_parcial,
        LocalTime horario_inicio,
        LocalTime horario_fim) {
}