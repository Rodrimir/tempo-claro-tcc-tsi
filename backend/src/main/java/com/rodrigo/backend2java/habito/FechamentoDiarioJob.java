package com.rodrigo.backend2java.habito;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import com.rodrigo.backend2java.usuario.model.Usuario;
import com.rodrigo.backend2java.execucao.FechamentoService;
import com.rodrigo.backend2java.execucao.model.StatusHabito;
import com.rodrigo.backend2java.infra.util.ZonaUsuario;
import com.rodrigo.backend2java.execucao.StatusHabitoRepository;
import com.rodrigo.backend2java.usuario.UsuarioRepository;
import com.rodrigo.backend2java.habito.model.HabitoRequestDTO.OcorrenciaRequestDTO;
import com.rodrigo.backend2java.habito.model.Habito;

@Component
public class FechamentoDiarioJob {

    private static final Logger log = LoggerFactory.getLogger(FechamentoDiarioJob.class);

    private static final int MAX_DIAS_POR_PASSADA = 60;

    private final HabitoRepository habitoRepository;
    private final UsuarioRepository usuarioRepository;
    private final StatusHabitoRepository statusHabitoRepository;
    private final ProximoVencimentoService proximoVencimentoService;
    private final FechamentoService fechamentoService;
    private final SubAtividadeRepository subAtividadeRepository;
    private final HabitoService habitoService;

    public FechamentoDiarioJob(HabitoRepository habitoRepository, UsuarioRepository usuarioRepository, StatusHabitoRepository statusHabitoRepository, ProximoVencimentoService proximoVencimentoService, FechamentoService fechamentoService, SubAtividadeRepository subAtividadeRepository, HabitoService habitoService) {
        this.habitoRepository = habitoRepository;
        this.usuarioRepository = usuarioRepository;
        this.statusHabitoRepository = statusHabitoRepository;
        this.proximoVencimentoService = proximoVencimentoService;
        this.fechamentoService = fechamentoService;
        this.subAtividadeRepository = subAtividadeRepository;
        this.habitoService = habitoService;
    }

    @Scheduled(fixedRate = 3_600_000L, initialDelay = 60_000L)
    public void apurarDiasFechados() {
        final var habitos = habitoRepository.findAllByAtivoTrue();
        if (habitos.isEmpty()) {
            return;
        }

        final Map<UUID, Usuario> usuarioPorId = new HashMap<>();
        var diasApurados = 0;

        for (final var habito : habitos) {
            try {
                final var usuario = usuarioPorId.computeIfAbsent(
                        habito.getUsuarioId(),
                        id -> usuarioRepository.findById(id).orElse(null));

                final var hoje = LocalDate.now(ZonaUsuario.resolver(usuario));
                diasApurados += apurarHabito(habito, usuario, hoje);
            } catch (final Exception e) {
                log.warn("Falha ao apurar virada de dia do hábito {}: {}", habito.getId(), e.getMessage());
            }
        }

        if (diasApurados > 0) {
            log.info("Fechamento diário: {} dia(s) apurado(s).", diasApurados);
        }
    }

    private int apurarHabito(final Habito habito, final Usuario usuario, final LocalDate hoje) {
        final var status = statusHabitoRepository.findById(habito.getId()).orElse(null);
        if (status == null) {
            return 0;
        }

        if (status.getUltimoReset() == null) {
            status.setUltimoReset(hoje);
            statusHabitoRepository.save(status);
            return 0;
        }

        var apurados = 0;
        var dia = status.getUltimoReset().plusDays(1);
        while (dia.isBefore(hoje) && apurados < MAX_DIAS_POR_PASSADA) {
            fechamentoService.fecharDia(habito, status, dia);
            apurados++;
            dia = dia.plusDays(1);
        }

        if (apurados == 0) {
            return 0;
        }

        status.setProximoVencimento(
                proximoVencimentoService.calcular(habito, usuario, Set.of()));
        statusHabitoRepository.save(status);
        aplicarProgressaoDeMeta(habito, status);
        return apurados;
    }

    private void aplicarProgressaoDeMeta(final Habito habito, final StatusHabito status) {
        final var incremento = habito.getIncremento();
        final var diasIncremento = habito.getDiasIncremento();
        if (incremento == null || incremento <= 0 || diasIncremento == null || diasIncremento <= 0) {
            return;
        }

        final var diasSeguidos = status.getDiasSeguidos();
        if (diasSeguidos == null || diasSeguidos <= 0 || diasSeguidos % diasIncremento != 0) {
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
        habitoService.gerarSubAtividades(habito.getId(), novaMeta, vezesAoDia, horarioUnico, ocorrenciasPreservadas)
                .forEach(subAtividadeRepository::save);

        log.info("Progressão de meta: hábito {} subiu de {} para {} (dias_seguidos={}, teto={}).",
                habito.getId(), metaAtual, novaMeta, diasSeguidos, metaMaxima);
    }
}
