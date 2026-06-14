// @audit-ok: BACKEND-RegisterRequestDTO.java-01
package com.rodrigo.backend2java.model.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Builder;

@Builder
public record RegisterRequestDTO(
    @NotBlank(message = "O nome é obrigatório")
    String nome,

    @NotBlank(message = "O email é obrigatório")
    @Email(message = "Email inválido")
    String email,

    @NotBlank(message = "A senha é obrigatória")
    String password
) {}
