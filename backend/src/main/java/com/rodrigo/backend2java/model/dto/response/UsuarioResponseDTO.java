package com.rodrigo.backend2java.model.dto.response;
import java.util.UUID;
import lombok.Builder;

// @audit-ok [E1.5 — resposta de GET /api/me. Existe porque a resposta de
// autenticação (AuthResponseDTO.UserDTO) só carrega nome/email — não dava
// pra saber o fuso_horario salvo sem reautenticar. Esta é a fonte de verdade
// que a tela de Perfil consulta ao montar, em vez do que ficou em cache
// desde o login.]
@Builder
public record UsuarioResponseDTO(
        UUID id,
        String nome,
        String email,
        String fuso_horario,
        String preferencia_idioma) {
}
