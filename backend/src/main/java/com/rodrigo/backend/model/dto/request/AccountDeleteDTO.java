package com.rodrigo.backend.model.dto.request;

import lombok.Builder;

// @audit-ok [Excluir Conta(1REQ) model request — controller de perfil: DELETE /api/profile; exige a senha para confirmar a exclusão]

@Builder
public record AccountDeleteDTO(
        String password) {
}
