package com.rodrigo.backend2java.autenticacao.model;

import com.rodrigo.backend2java.infra.util.EmailNormalizado;
import lombok.Builder;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Builder
public record ResetPasswordRequestDTO(
        @NotBlank(message = "{validacao.email.obrigatorio}") @Email(message = "{validacao.email.invalido}") String email,
        @NotBlank(message = "{validacao.codigo.obrigatorio}") String codigo,
        @NotBlank(message = "{validacao.novaSenha.obrigatoria}") String nova_senha) {
    public ResetPasswordRequestDTO {
        email = EmailNormalizado.de(email);
    }
}
