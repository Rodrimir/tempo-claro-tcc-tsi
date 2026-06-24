package com.rodrigo.backend2java.model.dto.request;

import lombok.Builder;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

// @audit-ok [Cadastro(1REQ) model request —  POST /auth/register]
@Builder
public record RegisterRequestDTO(
        @NotBlank(message = "O nome é obrigatório") String nome,

        @NotBlank(message = "O email é obrigatório") @Email(message = "Email inválido") String email,

        @NotBlank(message = "A senha é obrigatória") String password) {
}
