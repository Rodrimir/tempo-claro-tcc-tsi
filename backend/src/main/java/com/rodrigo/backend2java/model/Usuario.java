package com.rodrigo.backend2java.model;

import lombok.Data;
import java.util.UUID;
import lombok.Builder;
import java.time.OffsetDateTime;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

//@audit-ok [Login(3M) / Cadastro(3M) / Perfil(3M) — entidade Usuario representa a tabela de usuários no banco de dados]

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Usuario {

    private UUID id;
    private String nome;
    private String email;
    private String senhaHash;

    @Builder.Default
    private String fusoHorario = "America/Sao_Paulo";

    @Builder.Default
    private String preferenciaIdioma = "pt-BR";

    @Builder.Default
    private OffsetDateTime criadoEm = OffsetDateTime.now();
}
