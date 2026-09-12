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
import com.rodrigo.backend2java.usuario.Usuario;
import com.rodrigo.backend2java.execucao.FechamentoService;
import com.rodrigo.backend2java.execucao.StatusHabito;
import com.rodrigo.backend2java.infra.util.ZonaUsuario;
import com.rodrigo.backend2java.execucao.StatusHabitoRepository;
import com.rodrigo.backend2java.usuario.UsuarioRepository;
import com.rodrigo.backend2java.habito.HabitoRequestDTO.OcorrenciaRequestDTO;

/**
 * Varre os hábitos ativos de hora em hora e manda {@link FechamentoService} apurar
 * cada dia que já terminou e ainda não foi fechado.
 *
 * <p><b>Por que de hora em hora, e não à meia-noite.</b> Cada usuário tem seu
 * próprio fuso ({@code usu_fuso_horario}): a meia-noite acontece em instantes
 * diferentes para cada um, então não existe um horário único correto. Uma passada
 * por hora cobre todos os fusos com, no máximo, uma hora de atraso.
 *
 * <p><b>Por que apura vários dias de uma vez.</b> A instância do Render suspende
 * por inatividade e o job simplesmente não roda enquanto ela está dormindo — o
 * mesmo vale para o usuário que passa três dias sem abrir o app. Fechar só "ontem"
 * deixaria os dias do meio sem veredito, e RF13 manda zerar a ofensiva quando a
 * meta não é atingida. O laço vai de {@code sta_ultimo_reset + 1} até ontem,
 * inclusive — o dia corrente ainda está em andamento e não se fecha.
 */
@Component
public class FechamentoDiarioJob {

    private static final Logger log = LoggerFactory.getLogger(FechamentoDiarioJob.class);

    /** Trava de sanidade: um hábito parado há meses não vira milhares de iterações. */
    private static final int MAX_DIAS_POR_PASSADA = 60;

    private final HabitoRepository habitoRepository;
    private final UsuarioRepository usuarioRepository;
    private final StatusHabitoRepository statusHabitoRepository;
    private final ProximoVencimentoService proximoVencimentoService;
    private final FechamentoService fechamentoService;
    // Para apagar e recriar as sub_atividades quando a meta sobe, reaproveitando
    // gerarSubAtividades em vez de duplicar a regra de repartição de meta.
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

    // @audit-ok [Fechamento Diário (1) — varre os hábitos ativos e apura a virada de dia]
    @Scheduled(fixedRate = 3_600_000L, initialDelay = 60_000L)
    public void apurarDiasFechados() {
        final var habitos = habitoRepository.findAllByAtivoTrue();
        if (habitos.isEmpty()) {
            return;
        }

        // Cache por usuário: vários hábitos costumam pertencer ao mesmo dono, e sem
        // isso o job faria um SELECT em usuarios por hábito.
        final Map<UUID, Usuario> usuarioPorId = new HashMap<>();
        var diasApurados = 0;

        for (final var habito : habitos) {
            try {
                final var usuario = usuarioPorId.computeIfAbsent(
                        habito.getUsuarioId(),
                        id -> usuarioRepository.findById(id).orElse(null));

                // @audit-ok [Fechamento Diário (2) — resolve o fuso do dono do hábito.
                // ZonaUsuario.resolver é o único ponto que chama ZoneId.of, e já trata
                // fuso nulo, vazio ou inválido caindo no padrão.]
                final var hoje = LocalDate.now(ZonaUsuario.resolver(usuario));
                diasApurados += apurarHabito(habito, usuario, hoje);
            } catch (final Exception e) {
                // Um hábito problemático não pode interromper a apuração dos demais.
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

        // Primeiro contato: não há dia anterior para apurar, só marca o ponto de
        // partida. Sem isto, um hábito criado hoje teria seu dia de nascimento
        // fechado como "meta não cumprida" na primeira passada do job.
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

        // Só quando o dia virou de fato para este hábito: recalcular o vencimento a
        // cada hora empurraria o alvo para frente sem necessidade, e a progressão
        // de meta depende de dias_seguidos já fechado.
        // @audit-ok [E2.8 (item 4) — fecharDia acabou de zerar execucoes/valor
        // acumulado; sem nenhuma sub_atividade cumprida hoje ainda, calcular()
        // aponta para a 1ª ocorrência do dia novo.]
        status.setProximoVencimento(
                proximoVencimentoService.calcular(habito, usuario, Set.of()));
        statusHabitoRepository.save(status);
        aplicarProgressaoDeMeta(habito, status);
        return apurados;
    }

    // @audit-ok [E2.3 (item 2) — progressão automática de meta (RF04/F04).
    // hab_incremento = 0 (default do schema) desliga a progressão de propósito.
    // dias_seguidos > 0 e múltiplo de dias_incremento é o gatilho: com
    // dias_incremento = 10, a meta sobe quando a ofensiva bate 10, 20, 30 dias.]
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

        // Recalcula os sub_alvo com a meta nova, preservando a quantidade de
        // ocorrências e o horário de CADA uma — mesma operação de deletar+recriar
        // que atualizarHabito faz numa edição, só que disparada pelo job.
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
