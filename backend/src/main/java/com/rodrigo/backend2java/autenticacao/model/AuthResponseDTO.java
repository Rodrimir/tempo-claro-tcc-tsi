package com.rodrigo.backend2java.autenticacao.model;
import java.time.OffsetDateTime;
import lombok.Builder;
import com.rodrigo.backend2java.infra.util.ZonaUsuario;
import com.rodrigo.backend2java.usuario.model.Usuario;
@Builder
public record AuthResponseDTO(
        String token,
        UserDTO user)
{
    @Builder
    public record UserDTO(
            String name,
            String email,
            String fuso_horario,
            String fuso_pendente,
            OffsetDateTime fuso_vigente_em,
            String tema,
            String preferencia_idioma,
            boolean notificacoes_ativas,
            boolean som_ativo,
            boolean onboarding_concluido) {

        // fuso_horario é o fuso em vigor agora, já com uma troca pendente aplicada se passou a hora.
        public static UserDTO de(final Usuario usuario) {
            final var vigente = ZonaUsuario.resolver(usuario).getId();
            final var aindaPendente = usuario.getFusoPendente() != null
                    && !usuario.getFusoPendente().equals(vigente);
            return UserDTO.builder()
                    .name(usuario.getNome())
                    .email(usuario.getEmail())
                    .fuso_horario(vigente)
                    .fuso_pendente(aindaPendente ? usuario.getFusoPendente() : null)
                    .fuso_vigente_em(aindaPendente ? usuario.getFusoVigenteEm() : null)
                    .tema(usuario.getTema())
                    .preferencia_idioma(usuario.getPreferenciaIdioma())
                    .notificacoes_ativas(usuario.isNotificacoesAtivas())
                    .som_ativo(usuario.isSomAtivo())
                    .onboarding_concluido(usuario.getOnboardingConcluidoEm() != null)
                    .build();
        }
    }
}
