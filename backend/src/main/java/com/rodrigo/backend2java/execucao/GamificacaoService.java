package com.rodrigo.backend2java.execucao;
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
import com.rodrigo.backend2java.habito.model.Habito;
import com.rodrigo.backend2java.habito.model.SubAtividade;
import com.rodrigo.backend2java.usuario.model.Usuario;
import com.rodrigo.backend2java.biblioteca.model.BibliotecaTexto;
import com.rodrigo.backend2java.biblioteca.BibliotecaTextoRepository;
import com.rodrigo.backend2java.habito.AcessoHabitoService;
import com.rodrigo.backend2java.habito.SubAtividadeRepository;
import com.rodrigo.backend2java.habito.ProximoVencimentoService;
import com.rodrigo.backend2java.infra.util.ZonaUsuario;
import com.rodrigo.backend2java.infra.exception.RecursoNaoEncontradoException;
import com.rodrigo.backend2java.infra.exception.RegraDeNegocioException;
import com.rodrigo.backend2java.infra.exception.ValidacaoException;
import com.rodrigo.backend2java.execucao.model.HistoricoExecucao;
import com.rodrigo.backend2java.execucao.model.PrimingResponseDTO;
import com.rodrigo.backend2java.execucao.model.ExecutionRequestDTO;
import com.rodrigo.backend2java.execucao.model.ExecutionResponseDTO;

@Service
public class GamificacaoService {

    private static final double MULTIPLICADOR_EXTRA = 1.2;

    public static final int CUSTO_ESCUDO = 400;

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

    public GamificacaoService(StatusHabitoRepository statusHabitoRepository, HistoricoExecucaoRepository historicoRepository, BibliotecaTextoRepository bibliotecaRepository, ProximoVencimentoService proximoVencimentoService, SubAtividadeRepository subAtividadeRepository, AcessoHabitoService acessoHabitoService) {
        this.statusHabitoRepository = statusHabitoRepository;
        this.historicoRepository = historicoRepository;
        this.bibliotecaRepository = bibliotecaRepository;
        this.proximoVencimentoService = proximoVencimentoService;
        this.subAtividadeRepository = subAtividadeRepository;
        this.acessoHabitoService = acessoHabitoService;
    }

    public PrimingResponseDTO obterPriming(final UUID habitoId, final String emailContexto) {
        final var acesso = acessoHabitoService.carregar(habitoId, emailContexto);

        final var texto = buscarTextos(acesso.habito(), acesso.dono())
                .map(BibliotecaTexto::getTextoPreTarefa)
                .orElse(textoNoIdioma(acesso.dono(), TEXTO_PRE_TAREFA_PADRAO_PT, TEXTO_PRE_TAREFA_PADRAO_EN));

        return new PrimingResponseDTO(texto);
    }

    @Transactional
    public ExecutionResponseDTO processarExecucao(final UUID habitoId, final String emailContexto,
            final ExecutionRequestDTO request) {
        if (historicoRepository.existsByExecutionToken(request.execution_token())) {
            throw new RegraDeNegocioException("Execução duplicada");
        }

        final var acesso = acessoHabitoService.carregar(habitoId, emailContexto);
        final var habito = acesso.habito();
        final var dono = acesso.dono();

        final var status = statusHabitoRepository.findById(habitoId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Status do hábito não encontrado"));

        final var hojeLocal = LocalDate.now(ZonaUsuario.resolver(dono));

        final var tipoRequisicao = request.tipo();
        final var ehPedidoDeConclusao = tipoRequisicao == null || tipoRequisicao.isBlank()
                || "COMPLETE_PADRAO".equals(tipoRequisicao) || "COMPLETE_EXTRA".equals(tipoRequisicao);

        var textoFeedback = textoNoIdioma(dono, TEXTO_SUCESSO_PADRAO_PT, TEXTO_SUCESSO_PADRAO_EN);
        var bonus = false;
        var moedasGanhasAgora = 0;
        final String tipoResultado;
        UUID subAtividadeExecutada = null;

        if (ehPedidoDeConclusao) {
            final var execucoesAntes = status.getExecucoesHoje();
            final var subAtividades = subAtividadeRepository.findAllByHabitoIdOrderByOrdem(habitoId);
            final var fuso = ZonaUsuario.resolver(dono);
            final var agora = ZonedDateTime.now(fuso);
            final var feitasHojeIds = historicoRepository.agregarPorSubAtividadeNoDia(habitoId, hojeLocal).stream()
                    .map(HistoricoExecucaoRepository.AgregadoPorSubAtividade::getSubAtividadeId)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());
            final var ocorrencia = proximoVencimentoService.encontrarAtiva(subAtividades, feitasHojeIds, agora)
                    .orElse(ocorrenciaMaisTardia(subAtividades));
            subAtividadeExecutada = ocorrencia == null ? null : ocorrencia.getId();

            final var alvoDaOcorrencia = ocorrencia == null ? habito.getMetaBase() : ocorrencia.getAlvo();
            bonus = classificarConclusaoPeloValorRealizado(alvoDaOcorrencia, request.valor_realizado());
            tipoResultado = bonus ? "COMPLETE_EXTRA" : "COMPLETE_PADRAO";

            status.setExecucoesHoje(execucoesAntes + 1);
            status.setValorAcumuladoHoje(status.getValorAcumuladoHoje() + request.valor_realizado());

            final var percentualDoDia = (double) status.getValorAcumuladoHoje() / habito.getMetaBase();
            final var devidoHoje = TabelaDeMoedas.devidoPeloPercentual(percentualDoDia);
            moedasGanhasAgora = Math.max(0, devidoHoje - status.getMoedasCreditadasHoje());
            if (moedasGanhasAgora > 0) {
                status.setMoedasLocais(status.getMoedasLocais() + moedasGanhasAgora);
                status.setMoedasCreditadasHoje(status.getMoedasCreditadasHoje() + moedasGanhasAgora);
            }

            if (bonus) {
                textoFeedback = buscarTextos(habito, dono)
                        .map(BibliotecaTexto::getTextoSucessoExtra)
                        .orElse(textoNoIdioma(dono, TEXTO_SUCESSO_EXTRA_PT, TEXTO_SUCESSO_EXTRA_EN));
            } else {
                textoFeedback = buscarTextos(habito, dono)
                        .map(BibliotecaTexto::getTextoSucessoPadrao)
                        .orElse(textoNoIdioma(dono, TEXTO_SUCESSO_PADRAO_PT, TEXTO_SUCESSO_PADRAO_EN));
            }

            final var feitasComEsta = new HashSet<>(feitasHojeIds);
            if (subAtividadeExecutada != null) {
                feitasComEsta.add(subAtividadeExecutada);
            }
            status.setProximoVencimento(
                    proximoVencimentoService.calcular(habito, dono, feitasComEsta));
        } else if ("FAIL_BLOQUEIO".equals(tipoRequisicao)) {
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
            textoFeedback = textoNoIdioma(dono, TEXTO_DESISTENCIA_PT, TEXTO_DESISTENCIA_EN);
            tipoResultado = tipoRequisicao;
        } else {
            throw new ValidacaoException("Tipo de execução inválido: " + tipoRequisicao);
        }

        statusHabitoRepository.save(status);

        historicoRepository.save(HistoricoExecucao.builder()
                .id(UUID.randomUUID())
                .habitoId(habitoId)
                .subAtividadeId(subAtividadeExecutada)
                .executionToken(request.execution_token())
                .dataHoraExecucao(OffsetDateTime.now())
                .dataLocal(hojeLocal)
                .valorRealizado(request.valor_realizado())
                .moedasGanhas(moedasGanhasAgora)
                .tipoSucesso(mapearTipoSucesso(tipoResultado))
                .build());

        return ExecutionResponseDTO.builder()
                .moedas_ganhas_agora(moedasGanhasAgora)
                .moedas_totais(status.getMoedasLocais())
                .valor_acumulado_hoje(status.getValorAcumuladoHoje())
                .meta_base(habito.getMetaBase())
                .dias_seguidos(status.getDiasSeguidos())
                .novo_nivel(status.getNivelAvatar())
                .texto_feedback(textoFeedback)
                .bonus(bonus)
                .build();
    }

    private SubAtividade ocorrenciaMaisTardia(final List<SubAtividade> subAtividades) {
        return subAtividades.isEmpty() ? null : subAtividades.get(subAtividades.size() - 1);
    }

    private boolean classificarConclusaoPeloValorRealizado(final Integer alvoDaOcorrencia, final int valorRealizado) {
        return alvoDaOcorrencia != null && valorRealizado >= alvoDaOcorrencia * MULTIPLICADOR_EXTRA;
    }

    private Optional<BibliotecaTexto> buscarTextos(final Habito habito, final Usuario dono) {
        return bibliotecaRepository.findByCategoriaAndIdioma(habito.getCategoria(), idiomaDe(dono));
    }

    private String idiomaDe(final Usuario dono) {
        return dono != null && dono.getPreferenciaIdioma() != null && !dono.getPreferenciaIdioma().isBlank()
                ? dono.getPreferenciaIdioma()
                : "pt-BR";
    }

    private String textoNoIdioma(final Usuario dono, final String pt, final String en) {
        return "en-US".equals(idiomaDe(dono)) ? en : pt;
    }

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

        if (status.getMoedasLocais() < CUSTO_ESCUDO) {
            throw new RegraDeNegocioException("Saldo insuficiente");
        }

        status.setMoedasLocais(status.getMoedasLocais() - CUSTO_ESCUDO);
        status.setBloqueiosAcumulados(status.getBloqueiosAcumulados() + 1);
        statusHabitoRepository.save(status);
    }
}
