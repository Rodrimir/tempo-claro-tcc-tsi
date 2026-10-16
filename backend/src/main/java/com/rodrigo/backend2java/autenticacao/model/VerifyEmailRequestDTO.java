package com.rodrigo.backend2java.autenticacao.model;

import com.rodrigo.backend2java.infra.util.EmailNormalizado;
import lombok.Builder;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Builder
public record VerifyEmailRequestDTO(
        @NotBlank(message = "{validacao.email.obrigatorio}") @Email(message = "{validacao.email.invalido}") String email,
        @NotBlank(message = "{validacao.codigo.obrigatorio}") String codigo) {
    public VerifyEmailRequestDTO {
        email = EmailNormalizado.de(email);
    }
}
