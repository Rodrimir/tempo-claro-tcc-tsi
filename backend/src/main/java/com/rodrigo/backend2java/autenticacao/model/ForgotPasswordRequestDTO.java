package com.rodrigo.backend2java.autenticacao.model;

import com.rodrigo.backend2java.infra.util.EmailNormalizado;
import lombok.Builder;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Builder
public record ForgotPasswordRequestDTO(
        @NotBlank(message = "{validacao.email.obrigatorio}") @Email(message = "{validacao.email.invalido}") String email) {
    public ForgotPasswordRequestDTO {
        email = EmailNormalizado.de(email);
    }
}
