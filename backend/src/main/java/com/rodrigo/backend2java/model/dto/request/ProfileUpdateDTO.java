package com.rodrigo.backend2java.model.dto.request;

import lombok.Builder;

@Builder
public record ProfileUpdateDTO(
    String nome,
    String fuso_horario,
    String senha_atual,
    String nova_senha
) {}
