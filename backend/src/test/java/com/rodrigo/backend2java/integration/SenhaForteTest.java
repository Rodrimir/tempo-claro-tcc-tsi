package com.rodrigo.backend2java.integration;

import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.rodrigo.backend2java.BaseAPIIntegracaoTest;
import com.rodrigo.backend2java.autenticacao.RegisterRequestDTO;
import com.rodrigo.backend2java.infra.exception.MessageResponseDTO;
import com.rodrigo.backend2java.usuario.ProfileUpdateDTO;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * PLANO_REESTRUTURACAO.md, D — senha forte (8+ caracteres, maiúscula,
 * caractere especial) nas DUAS pontas: cadastro (AuthService.cadastrar, que
 * antes desta mudança não validava senha nenhuma) e troca de senha no perfil
 * (UsuarioService.atualizarPerfil). As duas passam por SenhaValidator.
 */
class SenhaForteTest extends BaseAPIIntegracaoTest {

    private String emailNovo() {
        return "senha-forte-" + UUID.randomUUID() + "@tempoclaro.test";
    }

    private RegisterRequestDTO registroCom(final String senha) {
        return RegisterRequestDTO.builder()
                .nome("Teste de Senha")
                .email(emailNovo())
                .password(senha)
                .build();
    }

    /**
     * {@code Object.class} de propósito: uma rejeição devolve o corpo de
     * {@code MessageResponseDTO} (success/message), não de {@code
     * AuthResponseDTO} (token/user) — deserializar direto como AuthResponseDTO
     * falha, porque é um record com construtor canônico e as duas formas não
     * têm nenhum campo em comum. Só o status importa aqui; quem quer o token
     * de uma aceitação usa AuthResponseDTO.class num teste à parte.
     */
    private int statusDoRegistro(final String senha) {
        return post("/api/auth/register", registroCom(senha), Object.class).getStatusCode().value();
    }

    @Test
    void cadastro_semMaiuscula_eRecusado() {
        assertEquals(400, statusDoRegistro("senha@123"));
    }

    @Test
    void cadastro_semCaractereEspecial_eRecusado() {
        assertEquals(400, statusDoRegistro("Senha1234"));
    }

    @Test
    void cadastro_curtaDemais_eRecusado() {
        assertEquals(400, statusDoRegistro("Sn@1"));
    }

    @Test
    void cadastro_comSenhaForte_eAceito() {
        final var resposta = post("/api/auth/register", registroCom("Senha@123"), MessageResponseDTO.class);

        assertEquals(201, resposta.getStatusCode().value());
        assertTrue(resposta.getBody().success());
    }

    @Test
    void trocaDeSenhaNoPerfil_semMaiuscula_eRecusada() {
        final var request = ProfileUpdateDTO.builder()
                .senha_atual(senhaUsuarioTeste)
                .nova_senha("nova@1234")
                .build();

        final var resposta = put("/api/profile", request, Object.class);

        assertEquals(400, resposta.getStatusCode().value());
    }

    @Test
    void trocaDeSenhaNoPerfil_semCaractereEspecial_eRecusada() {
        final var request = ProfileUpdateDTO.builder()
                .senha_atual(senhaUsuarioTeste)
                .nova_senha("NovaSenha1234")
                .build();

        final var resposta = put("/api/profile", request, Object.class);

        assertEquals(400, resposta.getStatusCode().value());
    }

    @Test
    void trocaDeSenhaNoPerfil_comSenhaForte_eAceita() {
        final var request = ProfileUpdateDTO.builder()
                .senha_atual(senhaUsuarioTeste)
                .nova_senha("NovaSenha@123")
                .build();

        final var resposta = put("/api/profile", request, Object.class);

        assertEquals(200, resposta.getStatusCode().value());
    }
}
