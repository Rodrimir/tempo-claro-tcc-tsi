package com.rodrigo.backend2java.model.dto.request;

import lombok.Builder;

// @audit-ok [Profile(1REQ) model request — controller de perfil: PUT /api/profile]

@Builder
public record ProfileUpdateDTO(
        String nome,
        String fuso_horario,
        String senha_atual,
        String nova_senha) {
}
