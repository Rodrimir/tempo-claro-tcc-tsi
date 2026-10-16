package com.rodrigo.backend2java.usuario;
import java.util.List;
import java.util.UUID;
import java.util.ArrayList;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import com.rodrigo.backend2java.execucao.StatusHabitoRepository;
import com.rodrigo.backend2java.habito.HabitoService;
import com.rodrigo.backend2java.habito.model.HabitoRequestDTO;
import com.rodrigo.backend2java.habito.model.HabitoRequestDTO.OcorrenciaRequestDTO;
import com.rodrigo.backend2java.infra.exception.ValidacaoException;
import com.rodrigo.backend2java.infra.util.EmailNormalizado;
import com.rodrigo.backend2java.infra.util.SenhaValidator;
import com.rodrigo.backend2java.usuario.model.Usuario;

// Contas prontas para os testadores e para a banca do TCC. Liga com CONTAS_TESTE_ATIVO=true e roda
// a cada partida, mas só cria a conta que ainda não existe: o progresso de quem já está testando
// fica como está, e uma conta excluída pelo app volta zerada na partida seguinte. Cada conta nasce
// como uma conta nova (e-mail já verificado, guia de primeiro acesso pendente) com um hábito de
// exercício pronto: halterzinho no último visual, moedas e escudos de sobra e ofensiva zerada.
// Senhas e o e-mail da banca vêm do ambiente para não ficarem no repositório.
@Component
@ConditionalOnProperty(name = "app.contas-teste.ativo", havingValue = "true")
public class CargaDeContasDeTeste implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(CargaDeContasDeTeste.class);

    static final int QUANTIDADE_DE_TESTADORES = 9;
    static final String DOMINIO_DOS_TESTADORES = "monzai.com.br";
    static final String NOME_DA_BANCA = "Banca Examinadora";
    static final int MOEDAS = 10_000;
    static final int ESCUDOS = 10;

    // O nível começa em 1 e sobe 1 a cada 10 dias de ofensiva: o 6 é o que 50 dias dariam. A arte
    // tem cinco variações e para no 5 (avatares.js), então o halterzinho já aparece no último visual.
    static final int NIVEL_DO_AVATAR = 6;

    // Uma ocorrência por dia, com janela larga para quem testar em qualquer hora: a conclusão é
    // aceita a partir de 15 min antes do início (GamificacaoService) e o lembrete sai nesse instante.
    static final HabitoRequestDTO HABITO = HabitoRequestDTO.builder()
            .titulo("Treino diário")
            .categoria("EXERCICIO")
            .tipo_medida("TEMPO")
            .meta_base(5)
            .meta_frequencia_diaria(1)
            .frequencia_semanal("1111111")
            .ocorrencias(List.of(new OcorrenciaRequestDTO(LocalTime.of(8, 0), LocalTime.of(22, 0))))
            .build();

    private record ContaDeTeste(String nome, String email, String senha) {
    }

    private final UsuarioRepository usuarioRepository;
    private final StatusHabitoRepository statusHabitoRepository;
    private final HabitoService habitoService;
    private final PasswordEncoder passwordEncoder;
    private final TransactionTemplate transacao;
    private final String senha;
    private final String emailDaBanca;
    private final String senhaDaBanca;

    public CargaDeContasDeTeste(UsuarioRepository usuarioRepository, StatusHabitoRepository statusHabitoRepository,
            HabitoService habitoService, PasswordEncoder passwordEncoder, PlatformTransactionManager gerenciadorDeTransacao,
            @Value("${app.contas-teste.senha:}") String senha,
            @Value("${app.contas-teste.email-banca:}") String emailDaBanca,
            @Value("${app.contas-teste.senha-banca:}") String senhaDaBanca) {
        this.usuarioRepository = usuarioRepository;
        this.statusHabitoRepository = statusHabitoRepository;
        this.habitoService = habitoService;
        this.passwordEncoder = passwordEncoder;
        this.transacao = new TransactionTemplate(gerenciadorDeTransacao);
        this.senha = senha.trim();
        this.emailDaBanca = EmailNormalizado.de(emailDaBanca);
        this.senhaDaBanca = senhaDaBanca.trim();
    }

    @Override
    public void run(final ApplicationArguments argumentos) {
        final var contas = new ArrayList<ContaDeTeste>();
        if (senhaValida(senha, "CONTAS_TESTE_SENHA")) {
            for (var i = 1; i <= QUANTIDADE_DE_TESTADORES; i++) {
                contas.add(new ContaDeTeste("Testador %02d".formatted(i),
                        "testador%02d@%s".formatted(i, DOMINIO_DOS_TESTADORES), senha));
            }
        }
        if (emailDaBanca.isBlank()) {
            log.warn("Conta da banca não criada: defina CONTAS_TESTE_EMAIL_BANCA.");
        } else if (senhaValida(senhaDaBanca, "CONTAS_TESTE_SENHA_BANCA")) {
            contas.add(new ContaDeTeste(NOME_DA_BANCA, emailDaBanca, senhaDaBanca));
        }

        var criadas = 0;
        for (final var conta : contas) {
            try {
                if (Boolean.TRUE.equals(transacao.execute(estado -> criarSeNaoExistir(conta)))) {
                    criadas++;
                }
            } catch (final RuntimeException falha) {
                log.error("Conta de teste {} não criada: {}", conta.email(), falha.getMessage());
            }
        }
        log.info("Contas de teste: {} criada(s) agora, de {} configurada(s).", criadas, contas.size());
    }

    private boolean criarSeNaoExistir(final ContaDeTeste conta) {
        if (usuarioRepository.existsByEmail(conta.email())) {
            return false;
        }
        usuarioRepository.save(Usuario.builder()
                .id(UUID.randomUUID())
                .nome(conta.nome())
                .email(conta.email())
                .senhaHash(passwordEncoder.encode(conta.senha()))
                .emailVerificado(true)
                .criadoEm(OffsetDateTime.now())
                .build());

        // Criado pelo mesmo serviço do app, para nascer com as ocorrências, o dia retroativo e o
        // fechamento iguais aos de um hábito comum. Só o saldo e o nível são ajustados depois.
        final var habito = habitoService.criarHabito(conta.email(), HABITO);
        final var status = statusHabitoRepository.findById(habito.id()).orElseThrow();
        status.setMoedasLocais(MOEDAS);
        status.setBloqueiosAcumulados(ESCUDOS);
        status.setNivelAvatar(NIVEL_DO_AVATAR);
        statusHabitoRepository.save(status);
        log.info("Conta de teste criada: {}", conta.email());
        return true;
    }

    private boolean senhaValida(final String valor, final String variavel) {
        if (valor.isBlank()) {
            log.warn("Contas de teste sem senha: defina {}.", variavel);
            return false;
        }
        try {
            SenhaValidator.exigirValida(valor);
            return true;
        } catch (final ValidacaoException senhaFraca) {
            log.error("{} não segue as regras de senha do app (8 a 25 caracteres, com maiúscula e caractere "
                    + "especial): essas contas não foram criadas.", variavel);
            return false;
        }
    }
}
