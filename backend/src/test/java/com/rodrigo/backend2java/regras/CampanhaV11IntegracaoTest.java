package com.rodrigo.backend2java.regras;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;

import com.rodrigo.backend2java.BaseAPIIntegracaoTest;
import com.rodrigo.backend2java.autenticacao.model.AuthResponseDTO;
import com.rodrigo.backend2java.autenticacao.model.LoginRequestDTO;
import com.rodrigo.backend2java.autenticacao.model.RegisterRequestDTO;
import com.rodrigo.backend2java.calibracao.model.CalibracaoRequestDTO;
import com.rodrigo.backend2java.calibracao.model.CalibracaoRequestDTO.RespostaDTO;
import com.rodrigo.backend2java.execucao.HistoricoExecucaoRepository;
import com.rodrigo.backend2java.execucao.StatusHabitoRepository;
import com.rodrigo.backend2java.execucao.model.HistoricoExecucao;
import com.rodrigo.backend2java.habito.HabitoRepository;
import com.rodrigo.backend2java.habito.model.DashboardResponseDTO;
import com.rodrigo.backend2java.habito.model.HabitoRequestDTO;
import com.rodrigo.backend2java.habito.model.HabitoResponseDTO;
import com.rodrigo.backend2java.infra.exception.MessageResponseDTO;
import com.rodrigo.backend2java.usuario.UsuarioRepository;
import com.rodrigo.backend2java.usuario.model.ProfileUpdateDTO;
import com.rodrigo.backend2java.usuario.model.UsuarioResponseDTO;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Achados da campanha v1.1 (docs/campanha-v1.1) e pedidos de 16/10/2026: e-mail normalizado,
 * validações que antes só o app fazia, mensagens em inglês, preferências guardadas no servidor,
 * guia de primeiro acesso, rota de saúde e a recuperação depois de dias com a API dormindo.
 */
class CampanhaV11IntegracaoTest extends BaseAPIIntegracaoTest {

    private static final ZoneId SP = ZoneId.of("America/Sao_Paulo");

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private HabitoRepository habitoRepository;

    @Autowired
    private StatusHabitoRepository statusHabitoRepository;

    @Autowired
    private HistoricoExecucaoRepository historicoExecucaoRepository;

    private HttpHeaders cabecalhos(final String idioma, final boolean comToken) {
        final var headers = comToken ? getHeaders() : new HttpHeaders();
        if (!comToken) {
            headers.add(HttpHeaders.CONTENT_TYPE, "application/json");
        }
        if (idioma != null) {
            headers.add(HttpHeaders.ACCEPT_LANGUAGE, idioma);
        }
        return headers;
    }

    private HabitoRequestDTO.HabitoRequestDTOBuilder agua(final int meta) {
        return HabitoRequestDTO.builder()
                .titulo("Água").categoria("AGUA").tipo_medida("QUANTIDADE").meta_base(meta)
                .meta_frequencia_diaria(1).horario_agendado(LocalTime.of(23, 59)).frequencia_semanal("1111111");
    }

    // ------------------------------------------------------------------ C03: e-mail

    @Test
    void c03_cadastroGuardaOEmailEmMinusculasESemEspacos() {
        final var email = "Ana." + UUID.randomUUID() + "@Exemplo.COM";
        rest.postForEntity("/api/auth/register", RegisterRequestDTO.builder().nome("Ana").email("  " + email + " ")
                .password("Senha@123").build(), MessageResponseDTO.class);

        assertTrue(usuarioRepository.findAll().stream().anyMatch(u -> u.getEmail().equals(email.toLowerCase())));
    }

    @Test
    void c03_mesmoEmailComOutraCaixa_eRecusado() {
        final var resposta = rest.postForEntity("/api/auth/register", RegisterRequestDTO.builder().nome("Outro")
                .email(emailUsuarioTeste.toUpperCase()).password("Senha@123").build(), MessageResponseDTO.class);

        assertEquals(422, resposta.getStatusCode().value());
    }

    @Test
    void c03_loginComMaiusculaEEspaco_entra() {
        final var resposta = rest.postForEntity("/api/auth/login",
                new LoginRequestDTO(" " + emailUsuarioTeste.toUpperCase() + " ", senhaUsuarioTeste), AuthResponseDTO.class);

        assertEquals(200, resposta.getStatusCode().value());
        assertEquals(emailUsuarioTeste, resposta.getBody().user().email());
    }

    // ------------------------------------------------------------------ C05 a C07

    @Test
    void c05_aguaMedidaEmTempo_eRecusada() {
        final var resposta = post("/api/habits", agua(1000).tipo_medida("TEMPO").build(), MessageResponseDTO.class);

        assertEquals(400, resposta.getStatusCode().value());
    }

    @Test
    void c06_respostaForaDasOpcoes_eRecusada() {
        final var resposta = post("/api/calibration", new CalibracaoRequestDTO("EXERCICIO",
                List.of(new RespostaDTO("EXPERIENCIA_PREVIA", "INVALIDO"))), MessageResponseDTO.class);

        assertEquals(400, resposta.getStatusCode().value());
        assertTrue(resposta.getBody().message().contains("EXPERIENCIA_PREVIA"));
    }

    @Test
    void c06_perguntaQueNaoExiste_eRecusada() {
        final var resposta = post("/api/calibration", new CalibracaoRequestDTO("AGUA",
                List.of(new RespostaDTO("COR_FAVORITA", "AZUL"))), MessageResponseDTO.class);

        assertEquals(400, resposta.getStatusCode().value());
    }

    @Test
    void c07_nomeEmBranco_eRecusadoENaoApagaONome() {
        final var resposta = put("/api/profile", ProfileUpdateDTO.builder().nome("   ").build(), MessageResponseDTO.class);

        assertEquals(400, resposta.getStatusCode().value());
        assertEquals("Usuário de Teste", get("/api/me", UsuarioResponseDTO.class).getBody().nome());
    }

    // ------------------------------------------------------------------ Mensagens em dois idiomas

    @Test
    void mensagens_emInglesComAcceptLanguage() {
        final var resposta = rest.exchange("/api/habits", HttpMethod.POST,
                new HttpEntity<>(agua(1000).titulo("").build(), cabecalhos("en-US", true)), MessageResponseDTO.class);

        assertEquals(400, resposta.getStatusCode().value());
        assertEquals("The title is required", resposta.getBody().message());
    }

    @Test
    void mensagens_emPortuguesPorPadrao() {
        final var resposta = post("/api/habits", agua(1000).titulo("").build(), MessageResponseDTO.class);

        assertEquals("O título é obrigatório", resposta.getBody().message());
    }

    @Test
    void mensagens_semCabecalho_seguemAPreferenciaDoUsuario() {
        put("/api/profile", ProfileUpdateDTO.builder().preferencia_idioma("en-US").build(), Object.class);

        final var resposta = get("/api/habits/" + UUID.randomUUID() + "/priming", MessageResponseDTO.class);

        assertEquals(404, resposta.getStatusCode().value());
        assertEquals("Habit not found", resposta.getBody().message());
    }

    @Test
    void mensagens_oCabecalhoValeMaisQueAPreferencia() {
        put("/api/profile", ProfileUpdateDTO.builder().preferencia_idioma("en-US").build(), Object.class);

        final var resposta = rest.exchange("/api/habits/" + UUID.randomUUID() + "/priming", HttpMethod.GET,
                new HttpEntity<>(cabecalhos("pt-BR", true)), MessageResponseDTO.class);

        assertEquals("Hábito não encontrado", resposta.getBody().message());
    }

    @Test
    void mensagens_regraDeNegocioComArgumentoEmIngles() {
        post("/api/habits", agua(1000).build(), Object.class);
        post("/api/habits", agua(1000).titulo("Segunda").build(), Object.class);

        final var resposta = rest.exchange("/api/habits", HttpMethod.POST,
                new HttpEntity<>(agua(1000).titulo("Terceira").build(), cabecalhos("en-US", true)),
                MessageResponseDTO.class);

        assertEquals(422, resposta.getStatusCode().value());
        assertEquals("You reached the limit of 2 active habits", resposta.getBody().message());
    }

    @Test
    void mensagens_tokenAusenteEmIngles() {
        final var resposta = rest.exchange("/api/dashboard", HttpMethod.GET,
                new HttpEntity<>(cabecalhos("en-US", false)), String.class);

        assertEquals(403, resposta.getStatusCode().value());
        assertTrue(resposta.getBody().contains("Missing or expired token."));
    }

    @Test
    void mensagens_sucessoDoCadastroEmIngles() {
        final var corpo = RegisterRequestDTO.builder().nome("Bob").email("bob." + UUID.randomUUID() + "@t.com")
                .password("Senha@123").build();

        final var resposta = rest.exchange("/api/auth/register", HttpMethod.POST,
                new HttpEntity<>(corpo, cabecalhos("en-US", false)), MessageResponseDTO.class);

        assertEquals("Sign-up received! We sent a verification code to your email.", resposta.getBody().message());
    }

    // ------------------------------------------------------------------ Preferências e guia

    @Test
    void preferencias_padroesDeUmaContaNova() {
        final var me = get("/api/me", UsuarioResponseDTO.class).getBody();

        assertTrue(me.notificacoes_ativas());
        assertTrue(me.som_ativo());
        assertFalse(me.onboarding_concluido());
    }

    @Test
    void preferencias_somELembretesFicamGuardados_eVoltamNoLogin() {
        put("/api/profile", ProfileUpdateDTO.builder().notificacoes_ativas(false).som_ativo(false)
                .tema("escuro").preferencia_idioma("en-US").build(), Object.class);

        final var me = get("/api/me", UsuarioResponseDTO.class).getBody();
        assertFalse(me.notificacoes_ativas());
        assertFalse(me.som_ativo());

        final var login = rest.postForEntity("/api/auth/login",
                new LoginRequestDTO(emailUsuarioTeste, senhaUsuarioTeste), AuthResponseDTO.class).getBody().user();
        assertFalse(login.notificacoes_ativas());
        assertFalse(login.som_ativo());
        assertEquals("escuro", login.tema());
        assertEquals("en-US", login.preferencia_idioma());
    }

    @Test
    void guia_concluirMarcaUmaVezSo() {
        final var primeira = post("/api/me/onboarding/concluir", null, UsuarioResponseDTO.class).getBody();
        final var marcadoEm = usuarioRepository.findById(idUsuarioTeste).orElseThrow().getOnboardingConcluidoEm();
        final var segunda = post("/api/me/onboarding/concluir", null, UsuarioResponseDTO.class).getBody();

        assertTrue(primeira.onboarding_concluido());
        assertTrue(segunda.onboarding_concluido());
        assertEquals(marcadoEm.toInstant(),
                usuarioRepository.findById(idUsuarioTeste).orElseThrow().getOnboardingConcluidoEm().toInstant());
    }

    // ------------------------------------------------------------------ Render

    @Test
    void health_respondeSemToken() {
        final var resposta = rest.getForEntity("/api/health", String.class);

        assertEquals(200, resposta.getStatusCode().value());
        assertTrue(resposta.getBody().contains("ok"));
    }

    @Test
    void apiDormindoTresDias_aPrimeiraChamadaFechaOsTres() {
        final var habitoId = post("/api/habits", agua(1000).build(), HabitoResponseDTO.class).getBody().id();
        final var hoje = LocalDate.now(SP);
        final var habito = habitoRepository.findById(habitoId).orElseThrow();
        habito.setCriadoEm(OffsetDateTime.now().minusDays(10));
        habitoRepository.save(habito);
        final var status = statusHabitoRepository.findById(habitoId).orElseThrow();
        status.setUltimoReset(hoje.minusDays(4));
        statusHabitoRepository.save(status);
        for (var dia = 1; dia <= 3; dia++) {
            historicoExecucaoRepository.save(HistoricoExecucao.builder()
                    .id(UUID.randomUUID()).habitoId(habitoId).executionToken(UUID.randomUUID())
                    .dataHoraExecucao(OffsetDateTime.now()).dataLocal(hoje.minusDays(dia)).valorRealizado(1000)
                    .moedasGanhas(100).tipoSucesso("COMPLETE_PADRAO").build());
        }

        final var painel = get("/api/dashboard", DashboardResponseDTO.class).getBody().habits().get(0);

        assertEquals(3, painel.dias_seguidos());
        assertEquals(hoje.minusDays(1), statusHabitoRepository.findById(habitoId).orElseThrow().getUltimoReset());
    }
}
