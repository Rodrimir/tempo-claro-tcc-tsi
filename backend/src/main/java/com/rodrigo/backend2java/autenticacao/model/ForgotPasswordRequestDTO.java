package com.rodrigo.backend2java.autenticacao.model;
import lombok.Builder;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Builder
public record ForgotPasswordRequestDTO(
        @NotBlank(message = "O email é obrigatório") @Email(message = "Email inválido") String email) {
}
