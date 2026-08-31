package com.rodrigo.backend2java.model.dto.request;
import lombok.Builder;
// @audit-ok [Profile(1REQ) model request — controller de perfil: PUT /api/profile]
@Builder
public record ProfileUpdateDTO(
        String nome,
        String fuso_horario,
        // @audit-ok [E3.4 (item 2) — 'claro'/'escuro'/'sistema', mesmo CHECK
        // ck_usu_tema do banco. Validado manualmente em UsuarioService, no
        // mesmo estilo de fuso_horario/ZonaUsuario — este DTO não usa Bean
        // Validation em nenhum outro campo.]
        String tema,
        String senha_atual,
        String nova_senha) {
}
