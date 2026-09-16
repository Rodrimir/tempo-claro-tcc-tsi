package com.rodrigo.backend2java.usuario;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import java.util.List;
import java.util.UUID;
import java.util.Collection;
import lombok.Builder;
import java.time.OffsetDateTime;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
//@audit-ok [Login(3M) / Cadastro(3M) / Perfil(3M) — entidade Usuario representa a tabela de usuários no banco de dados]
@Entity
@Table(name = "usuarios")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class Usuario implements UserDetails {

    @Id
    @Column(name = "usu_id")
    private UUID id;

    @Column(name = "usu_nome")
    private String nome;

    @Column(name = "usu_email")
    private String email;

    @Column(name = "usu_senha_hash")
    private String senhaHash;

    @Builder.Default
    @Column(name = "usu_fuso_horario")
    private String fusoHorario = "America/Sao_Paulo";

    @Builder.Default
    @Column(name = "usu_preferencia_idioma")
    private String preferenciaIdioma = "pt-BR";

    // @audit-ok [E3.4 (item 2) — espelha o DEFAULT 'sistema' da coluna
    // usu_tema (CHECK ck_usu_tema em 'claro'/'escuro'/'sistema').]
    @Builder.Default
    @Column(name = "usu_tema")
    private String tema = "sistema";

    @Builder.Default
    @Column(name = "usu_criado_em")
    private OffsetDateTime criadoEm = OffsetDateTime.now();

    // PLANO_REESTRUTURACAO.md, C — nasce false; AuthService.cadastrar só emite
    // token depois de POST /auth/verify-email confirmar o código.
    @Builder.Default
    @Column(name = "usu_email_verificado")
    private boolean emailVerificado = false;

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of();
    }

    @Override
    public String getPassword() {
        return senhaHash;
    }

    @Override
    public String getUsername() {
        return email;
    }

    // @audit-ok [C — isEnabled() é o gancho que o próprio Spring Security já
    // checa dentro de authenticationManager.authenticate() (DaoAuthentication
    // Provider). Sobrescrever aqui faz o login de uma conta não verificada
    // falhar SOZINHO, sem precisar de um if manual em AuthService.autenticar
    // — o framework lança DisabledException, que o GlobalExceptionHandler
    // traduz pra 403 com o motivo certo.]
    @Override
    public boolean isEnabled() {
        return emailVerificado;
    }
}
