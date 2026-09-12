package com.rodrigo.backend2java.autenticacao;
import lombok.Builder;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

// @audit-ok [Cadastro(1REQ) model request —  POST /auth/register]
@Builder
public record RegisterRequestDTO(
        @NotBlank(message = "O nome é obrigatório") String nome,

        @NotBlank(message = "O email é obrigatório") @Email(message = "Email inválido") String email,

        @NotBlank(message = "A senha é obrigatória") String password,

        // Opcional: o idioma que a interface já está usando no aparelho no momento
        // do cadastro (RNF13). Sem isto, todo cadastro nascia com preferencia_idioma
        // fixo em "pt-BR" mesmo que a pessoa tivesse trocado a interface para inglês
        // antes de se cadastrar — o texto vindo do servidor (biblioteca_textos,
        // calibração) ficava em português até uma troca manual no Perfil.
        String preferencia_idioma) {
}
