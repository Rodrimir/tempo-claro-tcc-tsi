package com.rodrigo.backend2java.model.dto.request;

import lombok.Builder;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
// @audit-ok [Login(1REQ) model request —  POST /auth/login]
@Builder
public record LoginRequestDTO(
        @NotBlank(message = "O email é obrigatório") @Email(message = "Email inválido") String email,

        @NotBlank(message = "A senha é obrigatória") String password) {
}
