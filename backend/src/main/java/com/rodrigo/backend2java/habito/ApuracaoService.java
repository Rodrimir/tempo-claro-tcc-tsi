package com.rodrigo.backend2java.habito;

import java.util.Set;
import java.util.UUID;
import java.time.LocalDate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.rodrigo.backend2java.usuario.model.Usuario;
import com.rodrigo.backend2java.habito.model.Habito;
import com.rodrigo.backend2java.execucao.FechamentoService;
import com.rodrigo.backend2java.execucao.StatusHabitoRepository;
import com.rodrigo.backend2java.execucao.model.StatusHabito;
import com.rodrigo.backend2java.infra.util.ZonaUsuario;
import com.rodrigo.backend2java.infra.exception.RecursoNaoEncontradoException;
import com.rodrigo.backend2java.habito.model.HabitoRequestDTO.OcorrenciaRequestDTO;

// Fecha os dias vencidos de um hábito. O job horário chama isto para cada hábito ativo, e as
// requisições que leem ou alteram os contadores do dia chamam antes de usá-los: no plano gratuito
// do Render a API dorme, e sem isso a primeira execução do dia somaria aos contadores de ontem.
@Service
public class ApuracaoService {

    private static final Logger log = LoggerFactory.getLogger(ApuracaoService.class);

    private static final int MAX_DIAS_POR_PASSADA = 60;

    private final HabitoRepository habitoRepository;
    private final StatusHabitoRepository statusHabitoRepository;
    private final SubAtividadeRepository subAtividadeRepository;
    private final ProximoVencimentoService proximoVencimentoService;
    private final FechamentoService fechamentoService;
    private final GeradorDeOcorrencias geradorDeOcorrencias;

    public ApuracaoService(HabitoRepository habitoRepository, StatusHabitoRepository statusHabitoRepository,
            SubAtividadeRepository subAtividadeRepository, ProximoVencimentoService proximoVencimentoService,
            FechamentoService fechamentoService, GeradorDeOcorrencias geradorDeOcorrencias) {
        this.habitoRepository = habitoRepository;
        this.statusHabitoRepository = statusHabitoRepository;
        this.subAtividadeRepository = subAtividadeRepository;
        this.proximoVencimentoService = proximoVencimentoService;
        this.fechamentoService = fechamentoService;
        this.geradorDeOcorrencias = geradorDeOcorrencias;
    }

    public record Apuracao(StatusHabito status, int diasApurados) {
    }

    public static boolean temDiaPendente(final StatusHabito status, final Usuario usuario) {
        final var ontem = LocalDate.now(ZonaUsuario.resolver(usuario)).minusDays(1);
        return status.getUltimoReset() == null || status.getUltimoReset().isBefore(ontem);
    }

    @Transactional
    public Apuracao apurarAteHoje(final UUID habitoId, final Usuario usuario) {
        final var status = statusHabitoRepository.travarPorHabitoId(habitoId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Status do hábito não encontrado"));
        final var habito = habitoRepository.findById(habitoId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Hábito não encontrado"));

        final var zona = ZonaUsuario.resolver(usuario);
        final var hoje = LocalDate.now(zona);

        if (status.getUltimoReset() == null) {
            status.setUltimoReset(hoje.minusDays(1));
            return new Apuracao(statusHabitoRepository.save(status), 0);
        }

        final var diaDaCriacao = habito.getCriadoEm() == null
                ? null
                : habito.getCriadoEm().atZoneSameInstant(zona).toLocalDate();

        var apurados = 0;
        var dia = status.getUltimoReset().plusDays(1);
        while (dia.isBefore(hoje) && apurados < MAX_DIAS_POR_PASSADA) {
            final var seguidosAntes = status.getDiasSeguidos();
            fechamentoService.fecharDia(habito, status, dia, dia.equals(diaDaCriacao));
            if (status.getDiasSeguidos() > seguidosAntes) {
                aplicarProgressaoDeMeta(habito, status.getDiasSeguidos());
            }
            apurados++;
            dia = dia.plusDays(1);
        }

        if (apurados == 0) {
            return new Apuracao(status, 0);
        }

        status.setProximoVencimento(proximoVencimentoService.calcular(habito, usuario, Set.of()));
        return new Apuracao(statusHabitoRepository.save(status), apurados);
    }

    // Avaliada a cada dia fechado, e só no dia em que a ofensiva subiu: assim um salto de vários
    // dias numa só passada não perde o múltiplo de dias_incremento, e um dia de folga ou protegido
    // por escudo não repete a progressão.
    private void aplicarProgressaoDeMeta(final Habito habito, final int diasSeguidos) {
        final var incremento = habito.getIncremento();
        final var diasIncremento = habito.getDiasIncremento();
        if (incremento == null || incremento <= 0 || diasIncremento == null || diasIncremento <= 0) {
            return;
        }
        if (diasSeguidos % diasIncremento != 0) {
            return;
        }

        final var metaAtual = habito.getMetaBase();
        final var metaMaxima = habito.getMetaMaxima();
        if (metaMaxima != null && metaAtual >= metaMaxima) {
            return;
        }

        final Integer novaMeta = metaMaxima != null ? Math.min(metaAtual + incremento, metaMaxima) : metaAtual + incremento;
        if (novaMeta.equals(metaAtual)) {
            return;
        }

        habito.setMetaBase(novaMeta);
        habitoRepository.save(habito);

        final var subAtividadesAtuais = subAtividadeRepository.findAllByHabitoIdOrderByOrdem(habito.getId());
        final var vezesAoDia = Math.max(subAtividadesAtuais.size(), 1);
        final var horarioUnico = subAtividadesAtuais.isEmpty() ? null : subAtividadesAtuais.get(0).getHorarioInicio();
        final var ocorrenciasPreservadas = subAtividadesAtuais.isEmpty()
                ? null
                : subAtividadesAtuais.stream()
                        .map(s -> new OcorrenciaRequestDTO(s.getHorarioInicio(), s.getHorarioFim()))
                        .toList();

        subAtividadeRepository.deleteAllByHabitoId(habito.getId());
        geradorDeOcorrencias.gerarSubAtividades(habito.getId(), novaMeta, vezesAoDia, horarioUnico, ocorrenciasPreservadas)
                .forEach(subAtividadeRepository::save);

        log.info("Progressão de meta: hábito {} subiu de {} para {} (dias_seguidos={}, teto={}).",
                habito.getId(), metaAtual, novaMeta, diasSeguidos, metaMaxima);
    }
}
