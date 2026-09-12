package com.rodrigo.backend2java.usuario;
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
        // RNF13: o idioma governa mais do que a interface — biblioteca_textos é
        // indexada por (categoria, idioma), então é ele que decide em que língua
        // vêm as frases de priming, os textos de sucesso e o questionário de
        // calibração. Validado em UsuarioService, no mesmo estilo do tema.
        String preferencia_idioma,
        String senha_atual,
        String nova_senha) {
}
