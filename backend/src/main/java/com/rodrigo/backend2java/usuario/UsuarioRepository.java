package com.rodrigo.backend2java.usuario;
import java.util.UUID;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

// @audit-ok [Schema v2.1 — tabela usuarios agora usa prefixo usu_*. Nomes de
// campo do model Usuario.java e dos DTOs não mudam, só as strings SQL e o
// RowMapper.]
// @audit-ok [E3.4 — usu_tema ganhou campo correspondente no model (ver
// Usuario.java). usu_atualizado_em continua sem campo Java — a coluna existe
// só para o CURRENT_TIMESTAMP do UPDATE abaixo, não precisa ida-e-volta.]
public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {

    // @audit-ok [Login(3) — repository de autenticação: verifica se existe antes de autenticar: POST /auth/login]
    // @audit-ok [Profile(3) — repository de perfil: verifica se existe antes de atualizar: PUT /api/profile]
    Optional<Usuario> findByEmail(String email);

    // @audit-ok [Cadastro(3) — repository de autenticação: COUNT para verificar existência sem trazer dados: POST /auth/register]
    boolean existsByEmail(String email);

    // @audit-ok [Profile(4) — repository de perfil: atualiza campos editáveis do usuário exceto criado_em: PUT /api/profile]
    @Modifying(clearAutomatically = true)
    @Query(value = "UPDATE usuarios SET usu_nome = ?2, usu_email = ?3, usu_senha_hash = ?4, "
            + "usu_fuso_horario = ?5, usu_preferencia_idioma = ?6, usu_tema = ?7, "
            + "usu_atualizado_em = CURRENT_TIMESTAMP WHERE usu_id = ?1", nativeQuery = true)
    void atualizarPerfil(UUID id, String nome, String email, String senhaHash,
            String fusoHorario, String preferenciaIdioma, String tema);
}
