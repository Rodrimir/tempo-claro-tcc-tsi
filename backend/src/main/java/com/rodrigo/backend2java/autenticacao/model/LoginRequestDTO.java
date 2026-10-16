package com.rodrigo.backend2java.autenticacao.model;

import com.rodrigo.backend2java.infra.util.EmailNormalizado;
import lombok.Builder;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
@Builder
public record LoginRequestDTO(
        @NotBlank(message = "{validacao.email.obrigatorio}") @Email(message = "{validacao.email.invalido}") String email,

        @NotBlank(message = "{validacao.senha.obrigatoria}") String password) {
    public LoginRequestDTO {
        email = EmailNormalizado.de(email);
    }
}
