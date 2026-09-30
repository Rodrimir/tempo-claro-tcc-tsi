package com.rodrigo.backend2java.autenticacao;
import lombok.Builder;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Builder
public record RegisterRequestDTO(
        @NotBlank(message = "O nome é obrigatório") String nome,

        @NotBlank(message = "O email é obrigatório") @Email(message = "Email inválido") String email,

        @NotBlank(message = "A senha é obrigatória") String password,

        String preferencia_idioma) {
}
