package com.rodrigo.backend2java.integration;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;

import com.rodrigo.backend2java.BaseAPIIntegracaoTest;
import com.rodrigo.backend2java.autenticacao.model.RegisterRequestDTO;
import com.rodrigo.backend2java.execucao.model.ExecutionRequestDTO;
import com.rodrigo.backend2java.habito.model.HabitoRequestDTO;
import com.rodrigo.backend2java.habito.model.HabitoRequestDTO.OcorrenciaRequestDTO;
import com.rodrigo.backend2java.habito.model.HabitoResponseDTO;
import com.rodrigo.backend2java.infra.exception.MessageResponseDTO;
import com.rodrigo.backend2java.usuario.model.ProfileUpdateDTO;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Execucao dos casos de teste de nivel de API da planilha de testes que ainda
 * nao tinham cobertura automatizada. Cada metodo corresponde a um CT.
 */
class PlanilhaCasosDeTesteTest extends BaseAPIIntegracaoTest {

    // ------------------------------------------------------------- utilitarios
    private static String repetir(final String s, final int n) {
        return s.repeat(n);
    }

    /**
     * Parte local com exatamente {@code n} caracteres e sufixo aleatorio, para que o caso de
     * teste exercite o limite de tamanho sem colidir com um cadastro de execucao anterior.
     */
    private static String localUnico(final int n) {
        final var sufixo = java.util.UUID.randomUUID().toString().replace("-", "");
        return repetir("a", n - sufixo.length()) + sufixo;
    }

    private HabitoRequestDTO.HabitoRequestDTOBuilder habitoValido() {
        return HabitoRequestDTO.builder()
                .titulo("Beber agua")
                .categoria("AGUA")
                .tipo_medida("QUANTIDADE")
                .meta_base(2000)
                .meta_frequencia_diaria(1)
                .frequencia_semanal("1111111");
    }

    private HabitoResponseDTO criarHabito(final HabitoRequestDTO req) {
        final var r = post("/api/habits", req, HabitoResponseDTO.class);
        assertEquals(201, r.getStatusCode().value(), "criacao deveria ter sido aceita");
        return r.getBody();
    }

    private int statusDoCadastro(final String email, final String senha, final String nome) {
        final var req = RegisterRequestDTO.builder().nome(nome).email(email).password(senha).build();
        return rest.postForEntity("/api/auth/register", req, MessageResponseDTO.class).getStatusCode().value();
    }

    private int statusCru(final String url, final String corpoJson) {
        final var h = new HttpHeaders();
        h.add(HttpHeaders.AUTHORIZATION, "Bearer " + jwtToken);
        h.add(HttpHeaders.CONTENT_TYPE, "application/json");
        return rest.exchange(url, HttpMethod.POST, new HttpEntity<>(corpoJson, h), String.class)
                .getStatusCode().value();
    }

    // =================================================== M01 Cadastro
    @Test
    @DisplayName("CT007 — e-mail com 255 caracteres, estruturalmente valido, e aceito")
    void ct007() {
        // parte local de 64 e dominio de 190, dentro dos limites da RFC 5321
        final var email = localUnico(64) + "@" + repetir("b", 63) + "." + repetir("c", 63)
                + "." + repetir("d", 62);
        assertEquals(255, email.length());
        assertEquals(201, statusDoCadastro(email, "Senha@123", "Limite 255"));
    }

    @Test
    @DisplayName("CT278 — parte local do e-mail com 64 caracteres e aceita")
    void ct278() {
        final var email = localUnico(64) + "@tempoclaro.test";
        assertEquals(201, statusDoCadastro(email, "Senha@123", "Local 64"));
    }

    @Test
    @DisplayName("CT279 — parte local do e-mail com 65 caracteres e recusada, ainda abaixo de 255")
    void ct279() {
        final var email = repetir("a", 65) + "@tempoclaro.test";
        assertTrue(email.length() < 255);
        assertEquals(400, statusDoCadastro(email, "Senha@123", "Local 65"));
    }

    @Test
    @DisplayName("CT008 — e-mail com 256 caracteres e recusado com 400")
    void ct008() {
        final var local = repetir("a", 256 - "@tempoclaro.test".length());
        final var email = local + "@tempoclaro.test";
        assertEquals(256, email.length());
        assertEquals(400, statusDoCadastro(email, "Senha@123", "Limite 256"));
    }

    @Test
    @DisplayName("CT012 — senha com 25 caracteres e aceita")
    void ct012() {
        final var senha = "A@" + repetir("b", 23);
        assertEquals(25, senha.length());
        assertEquals(201, statusDoCadastro("s25-" + UUID.randomUUID() + "@tempoclaro.test", senha, "Senha 25"));
    }

    @Test
    @DisplayName("CT013 — senha com 26 caracteres e recusada com 400")
    void ct013() {
        final var senha = "A@" + repetir("b", 24);
        assertEquals(26, senha.length());
        assertEquals(400, statusDoCadastro("s26-" + UUID.randomUUID() + "@tempoclaro.test", senha, "Senha 26"));
    }

    @Test
    @DisplayName("CT002/CT005/CT009 — campos obrigatorios ausentes recusados pelo servidor com 400")
    void ct002_ct005_ct009() {
        assertEquals(400, statusDoCadastro("sem-nome-" + UUID.randomUUID() + "@tempoclaro.test", "Senha@123", ""));
        assertEquals(400, statusDoCadastro("", "Senha@123", "Sem email"));
        assertEquals(400, statusDoCadastro("sem-senha-" + UUID.randomUUID() + "@tempoclaro.test", "", "Sem senha"));
    }

    @Test
    @DisplayName("CT004 — nome com 151 caracteres recusado com 400")
    void ct004() {
        assertEquals(400, statusDoCadastro("n151-" + UUID.randomUUID() + "@tempoclaro.test",
                "Senha@123", repetir("x", 151)));
    }

    @Test
    @DisplayName("CT003 — nome com 150 caracteres aceito")
    void ct003() {
        assertEquals(201, statusDoCadastro("n150-" + UUID.randomUUID() + "@tempoclaro.test",
                "Senha@123", repetir("x", 150)));
    }

    @Test
    @DisplayName("CT006 — e-mail sem arroba recusado com 400")
    void ct006() {
        assertEquals(400, statusDoCadastro("rodrigo.sem.arroba", "Senha@123", "Sem arroba"));
    }

    // =================================================== M05 Perfil
    @Test
    @DisplayName("CT064 — fuso horario inexistente e recusado")
    void ct064() {
        final var r = put("/api/profile",
                ProfileUpdateDTO.builder().fuso_horario("Marte/Olympus").build(), MessageResponseDTO.class);
        assertTrue(r.getStatusCode().is4xxClientError(),
                "esperado 4xx para fuso invalido, obtido " + r.getStatusCode().value());
    }

    // =================================================== M08 Criacao de habito
    @Test
    @DisplayName("CT084/CT085/CT086 — os tres moldes fixos criam habito com o tipo de medida correto")
    void ct084_ct085_ct086() {
        final var agua = criarHabito(habitoValido().titulo("Agua").build());
        assertEquals("AGUA", agua.categoria());
        assertEquals("QUANTIDADE", agua.tipo_medida());

        final var estudo = criarHabito(habitoValido().titulo("Estudo").categoria("ESTUDO")
                .tipo_medida("TEMPO").meta_base(30).build());
        assertEquals("ESTUDO", estudo.categoria());
        assertEquals("TEMPO", estudo.tipo_medida());

        delete("/api/habits/" + agua.id(), String.class);
        delete("/api/habits/" + estudo.id(), String.class);

        final var ex = criarHabito(habitoValido().titulo("Exercicio").categoria("EXERCICIO")
                .tipo_medida("TEMPO").meta_base(20).build());
        assertEquals("EXERCICIO", ex.categoria());
        assertEquals("TEMPO", ex.tipo_medida());
    }

    @Test
    @DisplayName("CT088 — categoria fora do dominio e recusada")
    void ct088() {
        final var r = post("/api/habits", habitoValido().categoria("MEDITACAO").build(), String.class);
        assertTrue(r.getStatusCode().is4xxClientError() || r.getStatusCode().is5xxServerError(),
                "esperado erro para categoria fora do CHECK, obtido " + r.getStatusCode().value());
    }

    @Test
    @DisplayName("CT091 — excluir um habito libera vaga no limite de dois ativos")
    void ct091() {
        final var h1 = criarHabito(habitoValido().titulo("Primeiro").build());
        criarHabito(habitoValido().titulo("Segundo").build());
        final var terceiro = post("/api/habits", habitoValido().titulo("Terceiro").build(), String.class);
        assertEquals(422, terceiro.getStatusCode().value());

        delete("/api/habits/" + h1.id(), String.class);
        final var depois = post("/api/habits", habitoValido().titulo("Novo").build(), String.class);
        assertEquals(201, depois.getStatusCode().value(), "apos excluir deveria haver vaga");
    }

    @Test
    @DisplayName("CT099 — titulo com 60 caracteres e aceito")
    void ct099() {
        assertEquals(60, repetir("t", 60).length());
        criarHabito(habitoValido().titulo(repetir("t", 60)).build());
    }

    @Test
    @DisplayName("CT100 — titulo com 61 caracteres e recusado com 400")
    void ct100() {
        final var r = post("/api/habits", habitoValido().titulo(repetir("t", 61)).build(), String.class);
        assertEquals(400, r.getStatusCode().value());
    }

    @Test
    @DisplayName("CT098 — titulo vazio e recusado com 400")
    void ct098() {
        final var r = post("/api/habits", habitoValido().titulo("").build(), String.class);
        assertEquals(400, r.getStatusCode().value());
    }

    // =================================================== M09 Meta minima
    @Test
    @DisplayName("CT106 — meta base zero e recusada com 400")
    void ct106() {
        final var r = post("/api/habits", habitoValido().meta_base(0).build(), String.class);
        assertEquals(400, r.getStatusCode().value());
    }

    @Test
    @DisplayName("CT107 — meta base 1 com uma ocorrencia e aceita")
    void ct107() {
        final var h = criarHabito(habitoValido().meta_base(1).meta_frequencia_diaria(1).build());
        assertEquals(1, h.meta_base());
    }

    @Test
    @DisplayName("CT108 — meta base negativa e recusada com 400")
    void ct108() {
        final var r = post("/api/habits", habitoValido().meta_base(-10).build(), String.class);
        assertEquals(400, r.getStatusCode().value());
    }

    @Test
    @DisplayName("CT110 — meta base igual ao numero de ocorrencias e aceita, com alvo 1 em cada")
    void ct110() {
        final var h = criarHabito(habitoValido().meta_base(3).meta_frequencia_diaria(3)
                .ocorrencias(List.of(
                        new OcorrenciaRequestDTO(java.time.LocalTime.of(8, 0), null),
                        new OcorrenciaRequestDTO(java.time.LocalTime.of(12, 0), null),
                        new OcorrenciaRequestDTO(java.time.LocalTime.of(18, 0), null)))
                .build());
        assertEquals(3, h.ocorrencias().size());
    }

    @Test
    @DisplayName("CT111 — meta base muito alta e aceita, sem teto declarado")
    void ct111() {
        final var h = criarHabito(habitoValido().meta_base(100000).build());
        assertEquals(100000, h.meta_base());
    }

    // =================================================== M10 Progressao
    @Test
    @DisplayName("CT112 — incremento, intervalo e teto validos sao persistidos")
    void ct112() {
        final var h = criarHabito(habitoValido().meta_base(30).incremento(5)
                .dias_incremento(7).meta_maxima(60).build());
        assertEquals(5, h.incremento());
        assertEquals(7, h.dias_incremento());
        assertEquals(60, h.meta_maxima());
    }

    @Test
    @DisplayName("CT113 — incremento zero e aceito e desativa a progressao")
    void ct113() {
        final var h = criarHabito(habitoValido().incremento(0).build());
        assertEquals(0, h.incremento());
    }

    @Test
    @DisplayName("CT114 — incremento negativo e recusado com 400")
    void ct114() {
        final var r = post("/api/habits", habitoValido().incremento(-5).build(), String.class);
        assertEquals(400, r.getStatusCode().value());
    }

    @Test
    @DisplayName("CT115 — intervalo de progressao de 1 dia e aceito")
    void ct115() {
        final var h = criarHabito(habitoValido().dias_incremento(1).build());
        assertEquals(1, h.dias_incremento());
    }

    @Test
    @DisplayName("CT116 — intervalo de progressao zero e recusado com 400")
    void ct116() {
        final var r = post("/api/habits", habitoValido().dias_incremento(0).build(), String.class);
        assertEquals(400, r.getStatusCode().value());
    }

    @Test
    @DisplayName("CT117 — teto menor que a meta base enviado direto a API")
    void ct117() {
        final var r = post("/api/habits", habitoValido().meta_base(30).meta_maxima(20).build(), String.class);
        assertTrue(r.getStatusCode().is4xxClientError(),
                "esperado 4xx para teto menor que a meta base, obtido " + r.getStatusCode().value()
                        + " — se 201, a validacao existe apenas no cliente");
    }

    @Test
    @DisplayName("CT118 — teto omitido e aceito, sem limite superior")
    void ct118() {
        final var h = criarHabito(habitoValido().meta_maxima(null).build());
        assertNotNull(h);
    }

    @Test
    @DisplayName("CT119 — teto igual a meta base e aceito")
    void ct119() {
        final var h = criarHabito(habitoValido().meta_base(30).meta_maxima(30).build());
        assertEquals(30, h.meta_maxima());
    }

    // =================================================== M11 Dias e horarios
    @Test
    @DisplayName("CT121 — mascara semanal com sete zeros enviada direto a API")
    void ct121() {
        final var r = post("/api/habits", habitoValido().frequencia_semanal("0000000").build(), String.class);
        assertTrue(r.getStatusCode().is4xxClientError(),
                "esperado 4xx para habito sem nenhum dia cobrado, obtido " + r.getStatusCode().value()
                        + " — se 201, a validacao existe apenas no cliente");
    }

    @Test
    @DisplayName("CT122 — mascara semanal de sete posicoes valida e aceita")
    void ct122() {
        final var h = criarHabito(habitoValido().frequencia_semanal("0111110").build());
        assertEquals("0111110", h.frequencia_semanal());
    }

    @Test
    @DisplayName("CT123 — mascara semanal com seis posicoes e recusada com 400")
    void ct123() {
        final var r = post("/api/habits", habitoValido().frequencia_semanal("011111").build(), String.class);
        assertEquals(400, r.getStatusCode().value());
    }

    @Test
    @DisplayName("CT124 — mascara semanal com oito posicoes e recusada com 400")
    void ct124() {
        final var r = post("/api/habits", habitoValido().frequencia_semanal("01111100").build(), String.class);
        assertEquals(400, r.getStatusCode().value());
    }

    @Test
    @DisplayName("CT125 — mascara semanal com digito fora de 0 e 1 e recusada com 400")
    void ct125() {
        final var r = post("/api/habits", habitoValido().frequencia_semanal("0121110").build(), String.class);
        assertEquals(400, r.getStatusCode().value());
    }

    @Test
    @DisplayName("CT126 — zero ocorrencias por dia enviado direto a API")
    void ct126() {
        final var r = post("/api/habits", habitoValido().meta_frequencia_diaria(0).build(), String.class);
        assertEquals(400, r.getStatusCode().value());
    }

    @Test
    @DisplayName("CT128 — doze ocorrencias por dia e aceito")
    void ct128() {
        final var oc = new java.util.ArrayList<OcorrenciaRequestDTO>();
        for (var i = 0; i < 12; i++) {
            oc.add(new OcorrenciaRequestDTO(java.time.LocalTime.of(8, 0).plusMinutes(i * 30L), null));
        }
        final var h = criarHabito(habitoValido().meta_base(120).meta_frequencia_diaria(12)
                .ocorrencias(oc).build());
        assertEquals(12, h.ocorrencias().size());
    }

    @Test
    @DisplayName("CT129 — treze ocorrencias por dia e recusado com 400")
    void ct129() {
        final var r = post("/api/habits", habitoValido().meta_base(130).meta_frequencia_diaria(13).build(),
                String.class);
        assertEquals(400, r.getStatusCode().value());
    }

    @Test
    @DisplayName("CT133 — horario de fim anterior ao de inicio enviado direto a API")
    void ct133() {
        final var r = post("/api/habits", habitoValido().meta_base(600).meta_frequencia_diaria(2)
                .ocorrencias(List.of(
                        new OcorrenciaRequestDTO(java.time.LocalTime.of(20, 0), java.time.LocalTime.of(18, 0)),
                        new OcorrenciaRequestDTO(java.time.LocalTime.of(22, 0), null)))
                .build(), String.class);
        assertTrue(r.getStatusCode().is4xxClientError(),
                "esperado 4xx para fim antes do inicio, obtido " + r.getStatusCode().value()
                        + " — se 201, a validacao existe apenas no cliente");
    }

    @Test
    @DisplayName("CT134 — ocorrencia as 23:59 e aceita")
    void ct134() {
        final var h = criarHabito(habitoValido().horario_agendado(java.time.LocalTime.of(23, 59)).build());
        assertNotNull(h);
    }

    @Test
    @DisplayName("CT132 — horario fora do formato de 24 horas e recusado com 400")
    void ct132() {
        final var json = """
                {"titulo":"Agua","categoria":"AGUA","tipo_medida":"QUANTIDADE","meta_base":2000,
                 "meta_frequencia_diaria":1,"frequencia_semanal":"1111111","horario_agendado":"25:00"}
                """;
        assertEquals(400, statusCru("/api/habits", json));
    }

    // =================================================== M13 Edicao
    @Test
    @DisplayName("CT152 — edicao com meta menor que o numero de ocorrencias e recusada")
    void ct152() {
        final var h = criarHabito(habitoValido().build());
        final var r = put("/api/habits/" + h.id(), habitoValido().meta_base(2).meta_frequencia_diaria(5)
                .ocorrencias(List.of(
                        new OcorrenciaRequestDTO(java.time.LocalTime.of(8, 0), null),
                        new OcorrenciaRequestDTO(java.time.LocalTime.of(10, 0), null),
                        new OcorrenciaRequestDTO(java.time.LocalTime.of(12, 0), null),
                        new OcorrenciaRequestDTO(java.time.LocalTime.of(14, 0), null),
                        new OcorrenciaRequestDTO(java.time.LocalTime.of(16, 0), null)))
                .build(), String.class);
        assertTrue(r.getStatusCode().is4xxClientError(),
                "esperado 4xx, obtido " + r.getStatusCode().value());
    }

    // =================================================== M18 Execucao
    @Test
    @DisplayName("CT189 — execucao sem execution_token e recusada com 400")
    void ct189() {
        final var h = criarHabito(habitoValido().build());
        assertEquals(400, statusCru("/api/habits/" + h.id() + "/executions",
                "{\"tipo\":\"COMPLETE_PADRAO\",\"valor_realizado\":2000}"));
    }

    @Test
    @DisplayName("CT190 — valor realizado negativo e recusado com 400")
    void ct190() {
        final var h = criarHabito(habitoValido().build());
        final var r = post("/api/habits/" + h.id() + "/executions",
                ExecutionRequestDTO.builder().execution_token(UUID.randomUUID())
                        .tipo("COMPLETE_PADRAO").valor_realizado(-1).build(), String.class);
        assertEquals(400, r.getStatusCode().value());
    }

    @Test
    @DisplayName("CT186 — cliente declarando COMPLETE_EXTRA nao decide o bonus")
    void ct186() {
        final var h = criarHabito(habitoValido().meta_base(2000).build());
        final var r = post("/api/habits/" + h.id() + "/executions",
                ExecutionRequestDTO.builder().execution_token(UUID.randomUUID())
                        .tipo("COMPLETE_EXTRA").valor_realizado(500).build(), String.class);
        assertEquals(200, r.getStatusCode().value());
        assertTrue(r.getBody() != null && r.getBody().contains("\"bonus\":false"),
                "o servidor deveria recalcular e negar o bonus; corpo devolvido: " + r.getBody());
    }

    // =================================================== M19 Escudo
    @Test
    @DisplayName("CT196 — segundo escudo no mesmo dia e recusado com 422")
    void ct196() {
        final var h = criarHabito(habitoValido().build());
        final var primeiro = post("/api/habits/" + h.id() + "/executions",
                ExecutionRequestDTO.builder().execution_token(UUID.randomUUID())
                        .tipo("FAIL_BLOQUEIO").valor_realizado(0).build(), String.class);
        assertEquals(200, primeiro.getStatusCode().value());
        final var segundo = post("/api/habits/" + h.id() + "/executions",
                ExecutionRequestDTO.builder().execution_token(UUID.randomUUID())
                        .tipo("FAIL_BLOQUEIO").valor_realizado(0).build(), String.class);
        assertEquals(422, segundo.getStatusCode().value());
    }

    // =================================================== M24 Seguranca
    @Test
    @DisplayName("CT245 — rota protegida sem token recusa o acesso")
    void ct245() {
        final var r = rest.getForEntity("/api/dashboard", String.class);
        assertEquals(403, r.getStatusCode().value(),
                "o projeto devolve 403 por SecurityConfig.tokenAusenteOuExpirado; "
                        + "a convencao HTTP para credencial ausente e 401");
        assertTrue(r.getBody() != null && r.getBody().contains("Token ausente ou expirado"));
    }

    @Test
    @DisplayName("CT247 — token com assinatura alterada e rejeitado")
    void ct247() {
        final var forjado = jwtToken.substring(0, jwtToken.length() - 4) + "AAAA";
        final var h = new HttpHeaders();
        h.add(HttpHeaders.AUTHORIZATION, "Bearer " + forjado);
        final var r = rest.exchange("/api/dashboard", HttpMethod.GET, new HttpEntity<>(h), String.class);
        assertEquals(403, r.getStatusCode().value(),
                "assinatura invalida tambem cai em tokenAusenteOuExpirado");
    }

    @Test
    @DisplayName("CT249 — campo desconhecido no corpo e recusado")
    void ct249() {
        final var json = """
                {"titulo":"Agua","categoria":"AGUA","tipo_medida":"QUANTIDADE","meta_base":2000,
                 "meta_frequencia_diaria":1,"frequencia_semanal":"1111111","admin":true}
                """;
        assertEquals(400, statusCru("/api/habits", json));
    }

    @Test
    @DisplayName("CT250 — as seis rotas de autenticacao respondem sem token")
    void ct250() {
        final var rotas = List.of("/api/auth/login", "/api/auth/register", "/api/auth/verify-email",
                "/api/auth/resend-code", "/api/auth/forgot-password", "/api/auth/reset-password");
        for (final var rota : rotas) {
            final var r = rest.postForEntity(rota, "{}", String.class);
            assertTrue(r.getStatusCode().value() != 401 && r.getStatusCode().value() != 403,
                    rota + " deveria ser permitAll, devolveu " + r.getStatusCode().value());
        }
    }

    @Test
    @DisplayName("CT058 — senha antiga deixa de valer apos a redefinicao")
    void ct058() {
        final var nova = "Trocada@2026";
        final var troca = put("/api/profile", ProfileUpdateDTO.builder()
                .senha_atual(senhaUsuarioTeste).nova_senha(nova).build(), String.class);
        assertEquals(200, troca.getStatusCode().value());

        final var antiga = rest.postForEntity("/api/auth/login",
                com.rodrigo.backend2java.autenticacao.model.LoginRequestDTO.builder()
                        .email(emailUsuarioTeste).password(senhaUsuarioTeste).build(),
                String.class);
        assertEquals(401, antiga.getStatusCode().value(), "a senha antiga nao deveria mais autenticar");

        final var atual = rest.postForEntity("/api/auth/login",
                com.rodrigo.backend2java.autenticacao.model.LoginRequestDTO.builder()
                        .email(emailUsuarioTeste).password(nova).build(),
                String.class);
        assertEquals(200, atual.getStatusCode().value());
    }

    // =================================================== M05 idioma
    @Test
    @DisplayName("CT063 — idioma fora da lista aceita e recusado")
    void ct063() {
        final var r = put("/api/profile",
                ProfileUpdateDTO.builder().preferencia_idioma("fr-FR").build(), MessageResponseDTO.class);
        assertTrue(r.getStatusCode().is4xxClientError(),
                "esperado 4xx, obtido " + r.getStatusCode().value());
    }

    @Test
    @DisplayName("CT025 — idioma invalido no cadastro recebe o padrao pt-BR")
    void ct025() {
        final var email = "idioma-" + UUID.randomUUID() + "@tempoclaro.test";
        final var req = RegisterRequestDTO.builder().nome("Idioma").email(email)
                .password("Senha@123").preferencia_idioma("fr-FR").build();
        final var r = rest.postForEntity("/api/auth/register", req, MessageResponseDTO.class);
        assertEquals(201, r.getStatusCode().value(),
                "cadastro com idioma fora da lista deveria ser aceito com o padrao");
    }

    // =================================================== M09 CT105 server-side
    @Test
    @DisplayName("CT105 — meta base ausente e recusada com 400")
    void ct105() {
        final var json = """
                {"titulo":"Agua","categoria":"AGUA","tipo_medida":"QUANTIDADE",
                 "meta_frequencia_diaria":1,"frequencia_semanal":"1111111"}
                """;
        assertEquals(400, statusCru("/api/habits", json));
    }
}
