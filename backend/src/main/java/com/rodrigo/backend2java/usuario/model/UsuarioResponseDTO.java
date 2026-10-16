package com.rodrigo.backend2java.usuario.model;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.Builder;
import com.rodrigo.backend2java.infra.util.ZonaUsuario;

@Builder
public record UsuarioResponseDTO(
        UUID id,
        String nome,
        String email,
        String fuso_horario,
        String fuso_pendente,
        OffsetDateTime fuso_vigente_em,
        String preferencia_idioma,
        String tema,
        boolean notificacoes_ativas,
        boolean som_ativo,
        boolean onboarding_concluido) {

    public static UsuarioResponseDTO de(final Usuario usuario) {
        final var vigente = ZonaUsuario.resolver(usuario).getId();
        final var aindaPendente = usuario.getFusoPendente() != null && !usuario.getFusoPendente().equals(vigente);
        return UsuarioResponseDTO.builder()
                .id(usuario.getId())
                .nome(usuario.getNome())
                .email(usuario.getEmail())
                .fuso_horario(vigente)
                .fuso_pendente(aindaPendente ? usuario.getFusoPendente() : null)
                .fuso_vigente_em(aindaPendente ? usuario.getFusoVigenteEm() : null)
                .preferencia_idioma(usuario.getPreferenciaIdioma())
                .tema(usuario.getTema())
                .notificacoes_ativas(usuario.isNotificacoesAtivas())
                .som_ativo(usuario.isSomAtivo())
                .onboarding_concluido(usuario.getOnboardingConcluidoEm() != null)
                .build();
    }
}
