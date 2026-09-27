package com.rodrigo.backend2java.usuario;
import java.util.UUID;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import com.rodrigo.backend2java.usuario.model.Usuario;

public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {

    Optional<Usuario> findByEmail(String email);

    // @note - 9.1 (Cadastro) existsByEmail: checagem de duplicidade usada em AuthService.cadastrar
    // (item 7.1a). Ver README §8 > Cadastro > item 9.
    // @audit-issue - 9.1 (Cadastro) [outcome: kept as-is] checagem sensível a
    // maiúsculas/minúsculas: nada normaliza o e-mail para caixa baixa antes de comparar ou salvar
    // (Usuario.java, item 9.2), então duas variações de maiúscula do mesmo endereço são tratadas
    // como contas diferentes. Levantado para decisão e confirmado pelo autor: e-mail é
    // case-sensitive de propósito, não normalizar.
    boolean existsByEmail(String email);

    @Modifying(clearAutomatically = true)
    @Query(value = "UPDATE usuarios SET usu_nome = ?2, usu_email = ?3, usu_senha_hash = ?4, "
            + "usu_fuso_horario = ?5, usu_preferencia_idioma = ?6, usu_tema = ?7, "
            + "usu_atualizado_em = CURRENT_TIMESTAMP WHERE usu_id = ?1", nativeQuery = true)
    void atualizarPerfil(UUID id, String nome, String email, String senhaHash,
            String fusoHorario, String preferenciaIdioma, String tema);
}
