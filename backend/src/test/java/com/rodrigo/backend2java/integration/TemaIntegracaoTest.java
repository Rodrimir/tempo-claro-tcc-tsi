package com.rodrigo.backend2java.integration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import com.rodrigo.backend2java.BaseAPIIntegracaoTest;
import com.rodrigo.backend2java.usuario.ProfileUpdateDTO;
import com.rodrigo.backend2java.usuario.UsuarioRepository;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * PLANO_REESTRUTURACAO.md, G — "dinamico" precisa ser aceito pelos dois lados
 * (constraint do banco E validação em UsuarioService); "roxo" continua
 * recusado nos dois.
 */
class TemaIntegracaoTest extends BaseAPIIntegracaoTest {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Test
    void salvarTemaDinamico_eAceito() {
        final var request = ProfileUpdateDTO.builder().tema("dinamico").build();

        final var resposta = put("/api/profile", request, Object.class);

        assertEquals(200, resposta.getStatusCode().value());
        final var usuario = usuarioRepository.findById(idUsuarioTeste).orElseThrow();
        assertEquals("dinamico", usuario.getTema());
    }

    @Test
    void salvarTemaInvalido_eRecusado() {
        final var request = ProfileUpdateDTO.builder().tema("roxo").build();

        final var resposta = put("/api/profile", request, Object.class);

        assertEquals(400, resposta.getStatusCode().value());
        final var usuario = usuarioRepository.findById(idUsuarioTeste).orElseThrow();
        assertEquals("sistema", usuario.getTema());
    }
}
