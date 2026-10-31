package com.rodrigo.backend2java.autenticacao.model;

import com.rodrigo.backend2java.infra.util.EmailNormalizado;
import lombok.Builder;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// @note - 5.1 (Cadastro) RegisterRequestDTO: campos validados por bean validation antes de
// AuthController.register rodar. Violação aqui vira MethodArgumentNotValidException, tratada em
// GlobalExceptionHandler.java (item 13.1). Ver README §8 > Cadastro > item 5.
@Builder
public record RegisterRequestDTO(
        @NotBlank(message = "{validacao.nome.obrigatorio}")
        @Size(max = 150, message = "{validacao.nome.tamanho}") String nome,

        @NotBlank(message = "{validacao.email.obrigatorio}")
        @Email(message = "{validacao.email.invalido}")
        @Size(max = 255, message = "{validacao.email.tamanho}") String email,

        @NotBlank(message = "{validacao.senha.obrigatoria}") String password,

        String preferencia_idioma) {
    public RegisterRequestDTO {
        email = EmailNormalizado.de(email);
    }
}
// @audit-issue - 5.1 (Cadastro) [outcome: fixed] nome e email não tinham @Size, e nome podia
// estourar o usu_nome VARCHAR(150) do banco (Usuario.java, item 9.2) como um
// DataIntegrityViolationException (item 13.4) em vez de um 400 limpo. Adicionado @Size(max=150)
// em nome e @Size(max=255) em email, espelhando as colunas do schema.sql e o .max() equivalente
// em Login/validation.js (item 2.1).
// @audit-info - 5.1 (Cadastro) [outcome: fixed elsewhere] password não ganhou @Size aqui de
// propósito: as outras regras de força de senha (mínimo, maiúscula, especial) já não são bean
// validation neste DTO, e sim SenhaValidator.motivoInvalida (item 8.1), reaplicado também por
// redefinirSenha (recuperação de senha). O teto de tamanho (TAMANHO_MAXIMO = 25) entrou lá, pelo
// mesmo motivo.
