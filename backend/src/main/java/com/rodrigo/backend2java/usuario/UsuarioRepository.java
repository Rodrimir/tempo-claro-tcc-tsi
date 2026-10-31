package com.rodrigo.backend2java.usuario;
import java.util.UUID;
import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.rodrigo.backend2java.usuario.model.Usuario;

public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {

    // Sem diferença de maiúsculas: contas antigas podem ter sido gravadas antes da normalização
    // (EmailNormalizado), e o schema.sql só converte as que não colidem.
    @Query("SELECT u FROM Usuario u WHERE lower(u.email) = lower(:email)")
    Optional<Usuario> findByEmail(@Param("email") String email);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT u FROM Usuario u WHERE lower(u.email) = lower(:email)")
    Optional<Usuario> travarPorEmail(@Param("email") String email);

    // @note - 9.1 (Cadastro) existsByEmail: checagem de duplicidade usada em AuthService.cadastrar
    // (item 7.1a). Ver README §8 > Cadastro > item 9.
    // @audit-issue - 9.1 (Cadastro) [outcome: fixed] a checagem era sensível a maiúsculas e duas
    // variações do mesmo endereço viravam contas diferentes; o login com a primeira letra
    // maiúscula também falhava. Em 16/10/2026 o autor revogou a decisão anterior: o e-mail é
    // normalizado nos DTOs de autenticação (EmailNormalizado) e comparado sem diferença de caixa.
    @Query("SELECT COUNT(u) > 0 FROM Usuario u WHERE lower(u.email) = lower(:email)")
    boolean existsByEmail(@Param("email") String email);
}
