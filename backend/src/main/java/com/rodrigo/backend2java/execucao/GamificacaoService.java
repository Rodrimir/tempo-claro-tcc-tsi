package com.rodrigo.backend2java.execucao;
import java.util.Set;
import java.util.List;
import java.util.UUID;
import java.util.HashSet;
import java.util.Optional;
import java.util.Objects;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.time.OffsetDateTime;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.rodrigo.backend2java.habito.Habito;
import com.rodrigo.backend2java.habito.SubAtividade;
import com.rodrigo.backend2java.usuario.Usuario;
import com.rodrigo.backend2java.biblioteca.BibliotecaTexto;
import com.rodrigo.backend2java.biblioteca.BibliotecaTextoRepository;
import com.rodrigo.backend2java.habito.AcessoHabitoService;
import com.rodrigo.backend2java.habito.SubAtividadeRepository;
import com.rodrigo.backend2java.habito.ProximoVencimentoService;
import com.rodrigo.backend2java.infra.util.ZonaUsuario;
import com.rodrigo.backend2java.infra.exception.RecursoNaoEncontradoException;
import com.rodrigo.backend2java.infra.exception.RegraDeNegocioException;
import com.rodrigo.backend2java.infra.exception.ValidacaoException;

/**
 * O que acontece durante o dia: priming, registro de execução e compra de escudo.
 *
 * <p><b>A execução não credita mais moedas.</b> RF11 credita "pela meta cumprida",
 * que é um evento do dia inteiro; quem faz a conta é {@link FechamentoService}, na
 * virada. Aqui a execução só acumula o realizado e avança o contador de ocorrências.
 * A resposta devolve uma <i>previsão</i> do que o dia renderá, para a tela de
 * sucesso mostrar um número sem reproduzir a fórmula no cliente (RF22/RNF08).
 */
// @audit-ok [Pré-Tarefa Priming (12) / Execução Timer (20) / Loja Escudo (12) — service de gamificação: priming, execução e compra de escudo]
@Service
public class GamificacaoService {

    private static final double MULTIPLICADOR_EXTRA = 1.2;
    private static final int CUSTO_ESCUDO = 1500;

    private static final String TEXTO_PRE_TAREFA_PADRAO_PT = "Concentre-se e respire fundo. Você consegue!";
    private static final String TEXTO_PRE_TAREFA_PADRAO_EN = "Focus and take a deep breath. You've got this!";
    private static final String TEXTO_SUCESSO_PADRAO_PT = "Execução registrada!";
    private static final String TEXTO_SUCESSO_PADRAO_EN = "Execution logged!";
    private static final String TEXTO_SUCESSO_EXTRA_PT = "Desempenho excelente!";
    private static final String TEXTO_SUCESSO_EXTRA_EN = "Excellent performance!";
    private static final String TEXTO_ESCUDO_PT = "Ofensiva protegida pelo escudo!";
    private static final String TEXTO_ESCUDO_EN = "Streak protected by the shield!";
    private static final String TEXTO_DESISTENCIA_PT = "Tudo bem. Amanhã tem outro começo.";
    private static final String TEXTO_DESISTENCIA_EN = "That's okay. Tomorrow is another start.";

    private final StatusHabitoRepository statusHabitoRepository;
    private final HistoricoExecucaoRepository historicoRepository;
    private final BibliotecaTextoRepository bibliotecaRepository;
    private final ProximoVencimentoService proximoVencimentoService;
    private final SubAtividadeRepository subAtividadeRepository;
    private final AcessoHabitoService acessoHabitoService;
    private final FechamentoService fechamentoService;

    public GamificacaoService(StatusHabitoRepository statusHabitoRepository, HistoricoExecucaoRepository historicoRepository, BibliotecaTextoRepository bibliotecaRepository, ProximoVencimentoService proximoVencimentoService, SubAtividadeRepository subAtividadeRepository, AcessoHabitoService acessoHabitoService, FechamentoService fechamentoService) {
        this.statusHabitoRepository = statusHabitoRepository;
        this.historicoRepository = historicoRepository;
        this.bibliotecaRepository = bibliotecaRepository;
        this.proximoVencimentoService = proximoVencimentoService;
        this.subAtividadeRepository = subAtividadeRepository;
        this.acessoHabitoService = acessoHabitoService;
        this.fechamentoService = fechamentoService;
    }

    // @audit-ok [Pré-Tarefa Priming (13) — busca texto pré-tarefa da biblioteca por categoria e idioma]
    public PrimingResponseDTO obterPriming(final UUID habitoId, final String emailContexto) {
        final var acesso = acessoHabitoService.carregar(habitoId, emailContexto);

        // RNF13 manda respeitar o idioma do usuário, e biblioteca_textos é indexada
        // por (categoria, idioma) justamente para isso — mas o literal "pt-BR"
        // estava fixo aqui e usu_preferencia_idioma nunca era lida.
        final var texto = buscarTextos(acesso.habito(), acesso.dono())
                .map(BibliotecaTexto::getTextoPreTarefa)
                .orElse(textoNoIdioma(acesso.dono(), TEXTO_PRE_TAREFA_PADRAO_PT, TEXTO_PRE_TAREFA_PADRAO_EN));

        return new PrimingResponseDTO(texto);
    }

    @Transactional
    public ExecutionResponseDTO processarExecucao(final UUID habitoId, final String emailContexto,
            final ExecutionRequestDTO request) {
        // @audit-ok [Execução Timer (21) — verifica idempotência: rejeita execution_token já registrado]
        // RF21/RNF09: protege contra duplo toque e retry de rede. A constraint
        // UNIQUE na coluna é a rede de segurança para duas requisições simultâneas.
        if (historicoRepository.existsByExecutionToken(request.execution_token())) {
            throw new RegraDeNegocioException("Execução duplicada");
        }

        final var acesso = acessoHabitoService.carregar(habitoId, emailContexto);
        final var habito = acesso.habito();
        final var dono = acesso.dono();

        final var status = statusHabitoRepository.findById(habitoId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Status do hábito não encontrado"));

        // A data que vale é a do fuso do dono, nunca a da JVM (UTC no Render): às
        // 21h no Brasil a execução cairia no dia seguinte e deslocaria o gráfico.
        final var hojeLocal = LocalDate.now(ZonaUsuario.resolver(dono));

        final var tipoRequisicao = request.tipo();
        final var ehPedidoDeConclusao = tipoRequisicao == null || tipoRequisicao.isBlank()
                || "COMPLETE_PADRAO".equals(tipoRequisicao) || "COMPLETE_EXTRA".equals(tipoRequisicao);

        var textoFeedback = textoNoIdioma(dono, TEXTO_SUCESSO_PADRAO_PT, TEXTO_SUCESSO_PADRAO_EN);
        var bonus = false;
        final String tipoResultado;
        UUID subAtividadeExecutada = null;

        if (ehPedidoDeConclusao) {
            final var execucoesAntes = status.getExecucoesHoje();
            final var subAtividades = subAtividadeRepository.findAllByHabitoIdOrderByOrdem(habitoId);
            // A ocorrência cumprida agora não é necessariamente a próxima por índice:
            // se a de hoje mais cedo já falhou (30 min depois do fim, sem execução),
            // esta conclusão pula pra próxima que ainda está em aberto — mesma regra
            // que decide o que a Home mostra como ATIVA.
            final var fuso = ZonaUsuario.resolver(dono);
            final var agora = ZonedDateTime.now(fuso);
            final var feitasHojeIds = historicoRepository.agregarPorSubAtividadeNoDia(habitoId, hojeLocal).stream()
                    .map(HistoricoExecucaoRepository.AgregadoPorSubAtividade::getSubAtividadeId)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());
            final var ocorrencia = proximoVencimentoService.encontrarAtiva(subAtividades, feitasHojeIds, agora)
                    .orElse(ocorrenciaMaisTardia(subAtividades));
            subAtividadeExecutada = ocorrencia == null ? null : ocorrencia.getId();

            // @audit-ok [Execução Timer (22)/(23) — RF22/RNF08: quem decide se a
            // conclusão foi padrão ou extra é o servidor, a partir de
            // valor_realizado contra o alvo da ocorrência. O que request.tipo()
            // afirmar é ignorado de propósito: um cliente modificado que mande
            // "COMPLETE_EXTRA" tendo cumprido só o alvo exato não engana a conta.]
            final var alvoDaOcorrencia = ocorrencia == null ? habito.getMetaBase() : ocorrencia.getAlvo();
            bonus = alvoDaOcorrencia != null
                    && request.valor_realizado() >= alvoDaOcorrencia * MULTIPLICADOR_EXTRA;
            tipoResultado = bonus ? "COMPLETE_EXTRA" : "COMPLETE_PADRAO";

            status.setExecucoesHoje(execucoesAntes + 1);
            status.setValorAcumuladoHoje(status.getValorAcumuladoHoje() + request.valor_realizado());

            if (bonus) {
                textoFeedback = buscarTextos(habito, dono)
                        .map(BibliotecaTexto::getTextoSucessoExtra)
                        .orElse(textoNoIdioma(dono, TEXTO_SUCESSO_EXTRA_PT, TEXTO_SUCESSO_EXTRA_EN));
            } else {
                textoFeedback = buscarTextos(habito, dono)
                        .map(BibliotecaTexto::getTextoSucessoPadrao)
                        .orElse(textoNoIdioma(dono, TEXTO_SUCESSO_PADRAO_PT, TEXTO_SUCESSO_PADRAO_EN));
            }

            // @audit-ok [E2.1 (item 2) — recalcula proximo_vencimento após toda
            // conclusão bem-sucedida. FAIL_BLOQUEIO/FAIL_TIMEOUT (abaixo) NÃO
            // recalculam de propósito: o vencimento precisa continuar no passado
            // para a expressão "falha" do avatar aparecer até a virada do dia.]
            // subAtividadeExecutada acabou de ser cumprida mas ainda não está salva
            // no histórico (isso só acontece mais abaixo) — soma ela ao conjunto na
            // mão, senão calcular() a veria como ainda pendente e devolveria o
            // mesmo vencimento de novo.
            final var feitasComEsta = new HashSet<>(feitasHojeIds);
            if (subAtividadeExecutada != null) {
                feitasComEsta.add(subAtividadeExecutada);
            }
            status.setProximoVencimento(
                    proximoVencimentoService.calcular(habito, dono, feitasComEsta));
        } else if ("FAIL_BLOQUEIO".equals(tipoRequisicao)) {
            // Escolha do usuário no modal de desistência — o servidor não teria
            // como inferir de valor_realizado. Marca o dia como protegido; quem
            // decide o destino da ofensiva é o fechamento (RF13/RF15).
            if (status.getBloqueiosAcumulados() <= 0) {
                throw new RegraDeNegocioException("Nenhum escudo disponível para proteger a ofensiva");
            }
            if (Boolean.TRUE.equals(status.getBloqueioUsadoHoje())) {
                throw new RegraDeNegocioException("Escudo já utilizado hoje neste hábito");
            }
            status.setBloqueiosAcumulados(status.getBloqueiosAcumulados() - 1);
            status.setBloqueioUsadoHoje(true);
            textoFeedback = textoNoIdioma(dono, TEXTO_ESCUDO_PT, TEXTO_ESCUDO_EN);
            tipoResultado = tipoRequisicao;
        } else if ("FAIL_TIMEOUT".equals(tipoRequisicao)) {
            // Desistência assumida: o valor parcial fica registrado (RF10), mas não
            // conta como realizado. Se o dia terminar abaixo da meta, é o
            // fechamento que zera a ofensiva.
            textoFeedback = textoNoIdioma(dono, TEXTO_DESISTENCIA_PT, TEXTO_DESISTENCIA_EN);
            tipoResultado = tipoRequisicao;
        } else {
            throw new ValidacaoException("Tipo de execução inválido: " + tipoRequisicao);
        }

        statusHabitoRepository.save(status);

        // @audit-ok [Execução Timer (25) — registra entrada no histórico com o execution_token]
        // his_moedas_ganhas fica 0: nenhuma moeda é creditada por execução.
        historicoRepository.save(HistoricoExecucao.builder()
                .id(UUID.randomUUID())
                .habitoId(habitoId)
                .subAtividadeId(subAtividadeExecutada)
                .executionToken(request.execution_token())
                .dataHoraExecucao(OffsetDateTime.now())
                .dataLocal(hojeLocal)
                .valorRealizado(request.valor_realizado())
                .moedasGanhas(0)
                .tipoSucesso(mapearTipoSucesso(tipoResultado))
                .build());

        // Previsão, não crédito: é quanto o dia rende se fechar como está agora.
        final var moedasPrevistas = fechamentoService.preverMoedasDoDia(habito, hojeLocal);

        return ExecutionResponseDTO.builder()
                .moedas_previstas_hoje(moedasPrevistas)
                .moedas_totais(status.getMoedasLocais())
                .valor_acumulado_hoje(status.getValorAcumuladoHoje())
                .meta_base(habito.getMetaBase())
                .dias_seguidos(status.getDiasSeguidos())
                .novo_nivel(status.getNivelAvatar())
                .texto_feedback(textoFeedback)
                .bonus(bonus)
                .build();
    }

    /**
     * Fallback defensivo para quando não há nenhuma ocorrência ATIVA (todas já
     * feitas ou falhas, mas mesmo assim uma execução chegou — a Home não deveria
     * ter liberado o Play nesse estado, mas o servidor não confia só nisso).
     * Mesmo comportamento de antes desta mudança: cai na última da lista.
     */
    private SubAtividade ocorrenciaMaisTardia(final List<SubAtividade> subAtividades) {
        return subAtividades.isEmpty() ? null : subAtividades.get(subAtividades.size() - 1);
    }

    private Optional<BibliotecaTexto> buscarTextos(final Habito habito, final Usuario dono) {
        return bibliotecaRepository.findByCategoriaAndIdioma(habito.getCategoria(), idiomaDe(dono));
    }

    private String idiomaDe(final Usuario dono) {
        return dono != null && dono.getPreferenciaIdioma() != null && !dono.getPreferenciaIdioma().isBlank()
                ? dono.getPreferenciaIdioma()
                : "pt-BR";
    }

    /**
     * Feedback que não vem da biblioteca (RF08/RF13, mas sem linha própria em
     * biblioteca_textos — protegido por escudo e desistência valem para toda
     * categoria, não fariam sentido como texto por categoria). RNF13 pede o
     * mesmo respeito ao idioma que os textos da biblioteca já recebem.
     */
    private String textoNoIdioma(final Usuario dono, final String pt, final String en) {
        return "en-US".equals(idiomaDe(dono)) ? en : pt;
    }

    // O CHECK ck_his_tipo aceita COMPLETE_PADRAO, COMPLETE_EXTRA, DESISTENCIA,
    // PROTEGIDO_ESCUDO e PROTEGIDO_AUTOMATICO. O vocabulário do request
    // (FAIL_BLOQUEIO/FAIL_TIMEOUT) é outro, herdado do front — esta tradução é a
    // ponte entre os dois. PROTEGIDO_AUTOMATICO só é gravado pelo fechamento.
    private String mapearTipoSucesso(final String tipoRequisicao) {
        return switch (tipoRequisicao) {
            case "FAIL_BLOQUEIO" -> "PROTEGIDO_ESCUDO";
            case "FAIL_TIMEOUT" -> "DESISTENCIA";
            default -> tipoRequisicao;
        };
    }

    @Transactional
    public void comprarEscudo(final UUID habitoId, final String emailContexto) {
        acessoHabitoService.carregar(habitoId, emailContexto);

        final var status = statusHabitoRepository.findById(habitoId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Status do hábito não encontrado"));

        // @audit-ok [Loja Escudo (13) — valida saldo antes de debitar]
        if (status.getMoedasLocais() < CUSTO_ESCUDO) {
            throw new RegraDeNegocioException("Saldo insuficiente");
        }

        // @audit-ok [Loja Escudo (14) — debita e incrementa bloqueiosAcumulados]
        status.setMoedasLocais(status.getMoedasLocais() - CUSTO_ESCUDO);
        status.setBloqueiosAcumulados(status.getBloqueiosAcumulados() + 1);
        statusHabitoRepository.save(status);
    }
}
