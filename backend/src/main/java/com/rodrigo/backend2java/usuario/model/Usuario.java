package com.rodrigo.backend2java.usuario.model;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
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
// @note - 9.2 (Cadastro) entidade gravada por UsuarioRepository.save (herdado de JpaRepository),
// chamado em AuthService.cadastrar (item 7.1c). Ver README §8 > Cadastro > item 9.
// @audit-ok - Tabela: usuarios | Campos: usu_id, usu_nome, usu_email, usu_senha_hash,
// usu_fuso_horario, usu_preferencia_idioma, usu_tema, usu_criado_em, usu_atualizado_em,
// usu_email_verificado | Avaliação: os campos batem com as colunas do schema.sql. usu_fuso_horario
// e usu_tema recebem defaults fixos que o cadastro não deixa o usuário escolher, e
// usu_email_verificado nasce false, coerente com o disparo do código de verificação (item 10.1).
// @audit-issue - 9.2 (Cadastro) [outcome: fixed] a coluna usu_atualizado_em existia no schema.sql
// mas não tinha campo nesta entidade: só UsuarioRepository.atualizarPerfil (query nativa, edição
// de perfil) a escrevia, então nas escritas via JPA (cadastro, verificação de e-mail, redefinição
// de senha) ela ficava congelada no DEFAULT CURRENT_TIMESTAMP da criação. Corrigido com o campo
// atualizadoEm e os callbacks marcarAtualizacao (@PrePersist/@PreUpdate) abaixo. Desde 16/10/2026
// a edição de perfil também grava pela entidade, sem query nativa.
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

    @Builder.Default
    @Column(name = "usu_tema")
    private String tema = "sistema";

    @Builder.Default
    @Column(name = "usu_criado_em")
    private OffsetDateTime criadoEm = OffsetDateTime.now();

    @Builder.Default
    @Column(name = "usu_atualizado_em")
    private OffsetDateTime atualizadoEm = OffsetDateTime.now();

    @Builder.Default
    @Column(name = "usu_email_verificado")
    private boolean emailVerificado = false;

    @Builder.Default
    @Column(name = "usu_notificacoes_ativas")
    private boolean notificacoesAtivas = true;

    @Builder.Default
    @Column(name = "usu_som_ativo")
    private boolean somAtivo = true;

    // Nulo até a pessoa terminar o guia de primeiro acesso.
    @Column(name = "usu_onboarding_concluido_em")
    private OffsetDateTime onboardingConcluidoEm;

    // Troca de fuso feita pelo Perfil: vale a partir de fusoVigenteEm, a meia-noite seguinte no
    // fuso de antes. ZonaUsuario.resolver já devolve o novo fuso quando esse instante passa.
    @Column(name = "usu_fuso_pendente")
    private String fusoPendente;

    @Column(name = "usu_fuso_vigente_em")
    private OffsetDateTime fusoVigenteEm;

    // @note - 9.2 (Cadastro) marcarAtualizacao: mantém usu_atualizado_em correto em toda escrita
    // via JPA (cadastro item 7.1c, verificação de e-mail e redefinição de senha), sem cada serviço
    // ter de lembrar de setar o campo.
    @PrePersist
    @PreUpdate
    private void marcarAtualizacao() {
        this.atualizadoEm = OffsetDateTime.now();
    }

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

    @Override
    public boolean isEnabled() {
        return emailVerificado;
    }
}
