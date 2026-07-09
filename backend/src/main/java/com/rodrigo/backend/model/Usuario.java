package com.rodrigo.backend.model;

import lombok.Data;
import java.util.UUID;
import lombok.Builder;
import jakarta.persistence.Id;
import java.time.OffsetDateTime;
import jakarta.persistence.Table;
import jakarta.persistence.Entity;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

//@audit-ok [Login(3M) / Cadastro(3M) / Perfil(3M) — entidade Usuario representa a tabela de usuários no banco de dados]

@Entity
@Table(name = "usuarios")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Usuario {

    @Id
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
