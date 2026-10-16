package com.rodrigo.backend2java.usuario;

import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.PlatformTransactionManager;

import com.rodrigo.backend2java.BaseAPIIntegracaoTest;
import com.rodrigo.backend2java.autenticacao.model.AuthResponseDTO;
import com.rodrigo.backend2java.autenticacao.model.LoginRequestDTO;
import com.rodrigo.backend2java.execucao.StatusHabitoRepository;
import com.rodrigo.backend2java.habito.HabitoRepository;
import com.rodrigo.backend2java.habito.HabitoService;
import com.rodrigo.backend2java.habito.model.DashboardResponseDTO;
import com.rodrigo.backend2java.infra.exception.MessageResponseDTO;
import com.rodrigo.backend2java.usuario.model.UsuarioResponseDTO;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Contas de teste para testadores e banca (pedido de 16/10/2026): entram sem verificar e-mail, com o
 * guia de primeiro acesso pendente e um hábito de exercício no último visual, sem ofensiva.
 */
@TestPropertySource(properties = {
        "app.contas-teste.ativo=true",
        "app.contas-teste.senha=Testador@2026",
        "app.contas-teste.email-banca= Banca.TCC@tempoclaro.test ",
        "app.contas-teste.senha-banca=Banca@2026" })
class CargaDeContasDeTesteIntegracaoTest extends BaseAPIIntegracaoTest {

    private static final String SENHA = "Testador@2026";
    private static final String EMAIL_DA_BANCA = "banca.tcc@tempoclaro.test";
    private static final String SENHA_DA_BANCA = "Banca@2026";

    @Autowired
    private CargaDeContasDeTeste carga;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private HabitoRepository habitoRepository;

    @Autowired
    private StatusHabitoRepository statusHabitoRepository;

    @Autowired
    private HabitoService habitoService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private PlatformTransactionManager gerenciadorDeTransacao;

    private static List<String> emailsDosTestadores() {
        final var emails = new ArrayList<String>();
        for (var i = 1; i <= CargaDeContasDeTeste.QUANTIDADE_DE_TESTADORES; i++) {
            emails.add("testador%02d@monzai.com.br".formatted(i));
        }
        return emails;
    }

    private void apagarContasDeTeste() {
        final var emails = new ArrayList<>(emailsDosTestadores());
        emails.add(EMAIL_DA_BANCA);
        emails.forEach(email -> usuarioRepository.findByEmail(email).ifPresent(usuarioRepository::delete));
    }

    // Cada teste parte das contas recém-criadas: o banco de teste sobrevive entre execuções, e dias
    // apurados desde a execução anterior já teriam gastado escudos.
    @BeforeEach
    void contasRecemCriadas() {
        apagarContasDeTeste();
        carga.run(null);
    }

    private void entrar(final String email, final String senha) {
        final var resposta = rest.postForEntity("/api/auth/login", new LoginRequestDTO(email, senha),
                AuthResponseDTO.class);
        assertEquals(200, resposta.getStatusCode().value(), email);
        jwtToken = resposta.getBody().token();
    }

    private void conferirContaNova(final String email, final String senha) {
        entrar(email, senha);

        assertFalse(get("/api/me", UsuarioResponseDTO.class).getBody().onboarding_concluido(), email);

        final var habitos = get("/api/dashboard", DashboardResponseDTO.class).getBody().habits();
        assertEquals(1, habitos.size(), email);
        final var habito = habitos.get(0);
        assertEquals("EXERCICIO", habito.categoria());
        assertEquals(CargaDeContasDeTeste.NIVEL_DO_AVATAR, habito.nivel_avatar());
        assertEquals(CargaDeContasDeTeste.MOEDAS, habito.moedas_locais());
        assertEquals(CargaDeContasDeTeste.ESCUDOS, habito.bloqueios_acumulados());
        assertEquals(0, habito.dias_seguidos());
        assertEquals(1, habito.ocorrencias().size());
    }

    @Test
    void testadoresEBanca_entramSemVerificarEmail_comGuiaPendenteEHalterzinhoNoUltimoVisual() {
        emailsDosTestadores().forEach(email -> conferirContaNova(email, SENHA));
        conferirContaNova(EMAIL_DA_BANCA, SENHA_DA_BANCA);
    }

    @Test
    void bancaTemSenhaPropria_aDosTestadoresNaoEntra() {
        final var resposta = rest.postForEntity("/api/auth/login", new LoginRequestDTO(EMAIL_DA_BANCA, SENHA),
                MessageResponseDTO.class);
        assertTrue(resposta.getStatusCode().is4xxClientError());
    }

    @Test
    void novaPartida_naoRecriaNemMexeNoProgressoDeQuemJaTesta() {
        final var usuario = usuarioRepository.findByEmail("testador01@monzai.com.br").orElseThrow();
        final var habito = habitoRepository.findAllByUsuarioIdAndAtivoTrue(usuario.getId()).get(0);
        final var status = statusHabitoRepository.findById(habito.getId()).orElseThrow();
        status.setMoedasLocais(1);
        statusHabitoRepository.save(status);

        carga.run(null);

        assertEquals(1, statusHabitoRepository.findById(habito.getId()).orElseThrow().getMoedasLocais());
        assertEquals(1, habitoRepository.findAllByUsuarioIdAndAtivoTrue(usuario.getId()).size());
    }

    @Test
    void contaExcluida_voltaZeradaNaPartidaSeguinte() {
        usuarioRepository.delete(usuarioRepository.findByEmail("testador09@monzai.com.br").orElseThrow());

        carga.run(null);

        conferirContaNova("testador09@monzai.com.br", SENHA);
    }

    @Test
    void senhaForaDasRegrasOuEmailDaBancaVazio_naoCriaNenhumaConta() {
        apagarContasDeTeste();

        new CargaDeContasDeTeste(usuarioRepository, statusHabitoRepository, habitoService, passwordEncoder,
                gerenciadorDeTransacao, "semmaiuscula!", "", SENHA_DA_BANCA).run(null);

        emailsDosTestadores().forEach(email -> assertTrue(usuarioRepository.findByEmail(email).isEmpty(), email));
        assertTrue(usuarioRepository.findByEmail(EMAIL_DA_BANCA).isEmpty());
    }
}
