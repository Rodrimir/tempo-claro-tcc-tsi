package com.rodrigo.backend2java.regras;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;

import com.rodrigo.backend2java.BaseAPIIntegracaoTest;
import com.rodrigo.backend2java.execucao.HistoricoExecucaoRepository;
import com.rodrigo.backend2java.execucao.StatusHabitoRepository;
import com.rodrigo.backend2java.execucao.model.HistoricoExecucao;
import com.rodrigo.backend2java.habito.model.DashboardResponseDTO;
import com.rodrigo.backend2java.habito.model.HabitoRequestDTO;
import com.rodrigo.backend2java.habito.model.HabitoResponseDTO;
import com.rodrigo.backend2java.infra.exception.MessageResponseDTO;
import com.rodrigo.backend2java.usuario.UsuarioRepository;
import com.rodrigo.backend2java.usuario.model.PreferenciasIniciaisDTO;
import com.rodrigo.backend2java.usuario.model.ProfileUpdateDTO;
import com.rodrigo.backend2java.usuario.model.UsuarioResponseDTO;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

/**
 * Troca de fuso adiada (pedido de 16/10/2026): a troca feita pelo Perfil só vale na meia-noite
 * seguinte do fuso de antes. O guia de primeiro acesso aplica na hora se ainda não há hábito. Os
 * fusos aceitos são os do Brasil e da América do Norte, e a virada do dia segue o fuso do usuário.
 */
class FusoHorarioIntegracaoTest extends BaseAPIIntegracaoTest {

    private static final ZoneId SP = ZoneId.of("America/Sao_Paulo");

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private StatusHabitoRepository statusHabitoRepository;

    @Autowired
    private HistoricoExecucaoRepository historicoExecucaoRepository;

    private UsuarioResponseDTO me() {
        return get("/api/me", UsuarioResponseDTO.class).getBody();
    }

    private void trocarFuso(final String fuso) {
        assertEquals(200, put("/api/profile", ProfileUpdateDTO.builder().fuso_horario(fuso).build(),
                Object.class).getStatusCode().value());
    }

    private UUID criarHabito() {
        final var request = HabitoRequestDTO.builder()
                .titulo("Água").categoria("AGUA").tipo_medida("QUANTIDADE").meta_base(1000)
                .meta_frequencia_diaria(1).horario_agendado(LocalTime.of(23, 59)).frequencia_semanal("1111111")
                .build();
        return post("/api/habits", request, HabitoResponseDTO.class).getBody().id();
    }

    @Test
    void trocaPeloPerfil_ficaPendenteAteAMeiaNoiteDoFusoAntigo() {
        trocarFuso("America/New_York");

        final var perfil = me();
        assertEquals("America/Sao_Paulo", perfil.fuso_horario());
        assertEquals("America/New_York", perfil.fuso_pendente());
        final var meiaNoiteEmSaoPaulo = LocalDate.now(SP).plusDays(1).atStartOfDay(SP).toInstant();
        assertEquals(meiaNoiteEmSaoPaulo, perfil.fuso_vigente_em().toInstant());
    }

    @Test
    void depoisDaMeiaNoite_oNovoFusoValeEFicaGravado() {
        trocarFuso("America/New_York");
        final var usuario = usuarioRepository.findById(idUsuarioTeste).orElseThrow();
        usuario.setFusoVigenteEm(OffsetDateTime.now().minusMinutes(1));
        usuarioRepository.save(usuario);

        final var perfil = me();

        assertEquals("America/New_York", perfil.fuso_horario());
        assertNull(perfil.fuso_pendente());
        final var gravado = usuarioRepository.findById(idUsuarioTeste).orElseThrow();
        assertEquals("America/New_York", gravado.getFusoHorario());
        assertNull(gravado.getFusoPendente());
    }

    @Test
    void escolherOFusoEmVigor_cancelaATrocaPendente() {
        trocarFuso("America/New_York");
        trocarFuso("America/Sao_Paulo");

        assertNull(me().fuso_pendente());
    }

    @Test
    void trocarDuasVezes_ficaSoAUltima() {
        trocarFuso("America/New_York");
        trocarFuso("America/Chicago");

        assertEquals("America/Chicago", me().fuso_pendente());
    }

    @ParameterizedTest
    @ValueSource(strings = { "Europe/London", "Asia/Tokyo", "Lua/Base" })
    void fusoForaDoBrasilEDaAmericaDoNorte_recusaCom400(final String fuso) {
        final var resposta = put("/api/profile", ProfileUpdateDTO.builder().fuso_horario(fuso).build(),
                MessageResponseDTO.class);

        assertEquals(400, resposta.getStatusCode().value());
        assertNull(me().fuso_pendente());
    }

    @Test
    void guiaSemHabito_aplicaIdiomaEFusoNaHora() {
        final var resposta = post("/api/me/onboarding/preferencias",
                new PreferenciasIniciaisDTO("en-US", "America/Denver"), UsuarioResponseDTO.class);

        assertEquals(200, resposta.getStatusCode().value());
        assertEquals("America/Denver", resposta.getBody().fuso_horario());
        assertEquals("en-US", resposta.getBody().preferencia_idioma());
        assertNull(resposta.getBody().fuso_pendente());
    }

    @Test
    void guiaComHabito_adiaOFuso() {
        criarHabito();

        final var resposta = post("/api/me/onboarding/preferencias",
                new PreferenciasIniciaisDTO("pt-BR", "America/Manaus"), UsuarioResponseDTO.class);

        assertEquals("America/Sao_Paulo", resposta.getBody().fuso_horario());
        assertEquals("America/Manaus", resposta.getBody().fuso_pendente());
    }

    // A virada do dia, as moedas e a ofensiva seguem o fuso do usuário. Com o fuso de cada caso,
    // a meta cumprida "ontem" (no fuso dele) fecha e soma a ofensiva.
    @ParameterizedTest
    @ValueSource(strings = { "America/Noronha", "America/Rio_Branco", "Pacific/Honolulu", "America/St_Johns",
            "America/Los_Angeles" })
    void fechamentoDoDia_usaOFusoDoUsuario(final String fuso) {
        post("/api/me/onboarding/preferencias", new PreferenciasIniciaisDTO("pt-BR", fuso), UsuarioResponseDTO.class);
        final var habitoId = criarHabito();
        final var zona = ZoneId.of(fuso);
        final var ontem = LocalDate.now(zona).minusDays(1);

        final var status = statusHabitoRepository.findById(habitoId).orElseThrow();
        assertEquals(ontem, status.getUltimoReset(), "o hábito nasce com ultimo_reset = ontem no fuso dele");
        status.setUltimoReset(ontem.minusDays(1));
        statusHabitoRepository.save(status);
        historicoExecucaoRepository.save(HistoricoExecucao.builder()
                .id(UUID.randomUUID()).habitoId(habitoId).executionToken(UUID.randomUUID())
                .dataHoraExecucao(OffsetDateTime.now()).dataLocal(ontem).valorRealizado(1000).moedasGanhas(100)
                .tipoSucesso("COMPLETE_PADRAO").build());

        final var painel = get("/api/dashboard", DashboardResponseDTO.class).getBody().habits().get(0);

        assertEquals(1, painel.dias_seguidos());
        assertEquals(ontem, statusHabitoRepository.findById(habitoId).orElseThrow().getUltimoReset());
    }
}
