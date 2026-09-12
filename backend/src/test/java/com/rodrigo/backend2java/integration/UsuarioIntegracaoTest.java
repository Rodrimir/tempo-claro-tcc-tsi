package com.rodrigo.backend2java.integration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;

import com.rodrigo.backend2java.BaseAPIIntegracaoTest;
import com.rodrigo.backend2java.usuario.ProfileUpdateDTO;
import com.rodrigo.backend2java.usuario.UsuarioRepository;
import com.rodrigo.backend2java.usuario.UsuarioResponseDTO;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class UsuarioIntegracaoTest extends BaseAPIIntegracaoTest {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Test
    void getMe_devolveOsDadosDoUsuarioAutenticado() {
        final var me = get("/api/me", UsuarioResponseDTO.class).getBody();

        assertEquals(idUsuarioTeste, me.id());
        assertEquals(emailUsuarioTeste, me.email());
        assertEquals("America/Sao_Paulo", me.fuso_horario());
        assertEquals("sistema", me.tema());
    }

    @Test
    void putProfile_atualizaNomeFusoETema_ecarimbaAtualizadoEm() {
        final var antes = usuarioRepository.findById(idUsuarioTeste).orElseThrow();

        final var request = ProfileUpdateDTO.builder()
                .nome("Nome Editado")
                .fuso_horario("America/Bahia")
                .tema("escuro")
                .build();
        final var resposta = put("/api/profile", request, Object.class);

        assertEquals(HttpStatus.OK, resposta.getStatusCode());
        final var depois = usuarioRepository.findById(idUsuarioTeste).orElseThrow();
        assertEquals("Nome Editado", depois.getNome());
        assertEquals("America/Bahia", depois.getFusoHorario());
        assertEquals("escuro", depois.getTema());
        assertEquals(antes.getSenhaHash(), depois.getSenhaHash());

        final var me = get("/api/me", UsuarioResponseDTO.class).getBody();
        assertEquals("Nome Editado", me.nome());
        assertEquals("America/Bahia", me.fuso_horario());
        assertEquals("escuro", me.tema());
    }

    @Test
    void putProfile_trocaDeSenha_exigeSenhaAtualCorreta() {
        final var semSenhaAtual = ProfileUpdateDTO.builder()
                .nova_senha("NovaSenha@123")
                .build();
        final var respostaSemSenhaAtual = put("/api/profile", semSenhaAtual, Object.class);
        assertEquals(HttpStatus.BAD_REQUEST, respostaSemSenhaAtual.getStatusCode());

        final var comSenhaErrada = ProfileUpdateDTO.builder()
                .senha_atual("SenhaErrada@1")
                .nova_senha("NovaSenha@123")
                .build();
        final var respostaSenhaErrada = put("/api/profile", comSenhaErrada, Object.class);
        // 422, e não 401: a sessão continua válida. Se fosse 401, o app trataria
        // como token expirado e derrubaria o usuário por um erro de digitação.
        assertEquals(422, respostaSenhaErrada.getStatusCode().value());

        final var antes = usuarioRepository.findById(idUsuarioTeste).orElseThrow();

        final var comSenhaCorreta = ProfileUpdateDTO.builder()
                .senha_atual(senhaUsuarioTeste)
                .nova_senha("NovaSenha@123")
                .build();
        final var respostaOk = put("/api/profile", comSenhaCorreta, Object.class);
        assertEquals(HttpStatus.OK, respostaOk.getStatusCode());

        final var depois = usuarioRepository.findById(idUsuarioTeste).orElseThrow();
        assertNotNull(depois.getSenhaHash());
        assertTrue(!depois.getSenhaHash().equals(antes.getSenhaHash()));
    }
}
