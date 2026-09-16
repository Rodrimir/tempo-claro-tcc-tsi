package com.rodrigo.backend2java.autenticacao;
import lombok.Builder;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Builder
public record ResetPasswordRequestDTO(
        @NotBlank(message = "O email é obrigatório") @Email(message = "Email inválido") String email,
        @NotBlank(message = "O código é obrigatório") String codigo,
        @NotBlank(message = "A nova senha é obrigatória") String nova_senha) {
}
