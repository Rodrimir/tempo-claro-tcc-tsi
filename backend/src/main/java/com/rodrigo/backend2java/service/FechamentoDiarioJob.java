package com.rodrigo.backend2java.service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import com.rodrigo.backend2java.model.Habito;
import com.rodrigo.backend2java.model.Usuario;
import com.rodrigo.backend2java.model.StatusHabito;
import com.rodrigo.backend2java.util.ZonaUsuario;
import com.rodrigo.backend2java.repository.HabitoRepository;
import com.rodrigo.backend2java.repository.StatusHabitoRepository;
import com.rodrigo.backend2java.repository.SubAtividadeRepository;
import com.rodrigo.backend2java.repository.UsuarioRepository;
import com.rodrigo.backend2java.model.dto.request.HabitoRequestDTO.OcorrenciaRequestDTO;

// @audit-ok [Fechamento Diário — job de virada de dia: zera execucoes_hoje e
// bloqueio_usado_hoje de cada hábito ativo assim que o dia vira no fuso do
// respectivo usuário.]
//
// Por que este job existe: sem ele, execucoes_hoje só crescia e bloqueio_usado_hoje
// nunca voltava a false. Na prática o hábito diário travava depois de atingir a
// meta_frequencia_diaria uma única vez — a ofensiva parava de contar e o escudo
// nunca podia ser reutilizado. Era a peça que faltava na mecânica central.
//
// Roda de hora em hora, e não uma vez por dia à meia-noite, porque cada usuário
// tem seu próprio fuso (usuarios.fuso_horario): a meia-noite acontece em momentos
// diferentes para cada um. Uma passada por hora cobre todos os fusos com no
// máximo 1h de atraso.
@Component
@RequiredArgsConstructor
public class FechamentoDiarioJob {

    private static final Logger log = LoggerFactory.getLogger(FechamentoDiarioJob.class);

    private final HabitoRepository habitoRepository;
    private final UsuarioRepository usuarioRepository;
    private final StatusHabitoRepository statusHabitoRepository;
    private final ProximoVencimentoService proximoVencimentoService;
    // @audit-ok [E2.3 — dependências novas: SubAtividadeRepository para apagar/
    // recriar as sub_atividades quando a meta sobe, e HabitoService só para
    // reaproveitar gerarSubAtividades (pacote-privado, mesmo pacote "service"),
    // em vez de duplicar a regra de repartição de meta que já existe lá.]
    private final SubAtividadeRepository subAtividadeRepository;
    private final HabitoService habitoService;

    // @audit-ok [Fechamento Diário (1) — varre os hábitos ativos e apura a virada de dia]
    @Scheduled(fixedRate = 3_600_000L, initialDelay = 60_000L)
    public void resetarContadoresDiarios() {
        final var habitos = habitoRepository.findAllAtivos();
        if (habitos.isEmpty()) {
            return;
        }

        // Cache por usuário: vários hábitos costumam pertencer ao mesmo dono, e sem
        // isso o job faria um SELECT em usuarios por hábito.
        // E2.1: guarda o Usuario inteiro agora (não só o ZoneId já resolvido),
        // porque proximoVencimentoService.calcular também precisa dele.
        final Map<UUID, Usuario> usuarioPorId = new HashMap<>();
        var resetados = 0;

        for (final var habito : habitos) {
            try {
                final var usuario = usuarioPorId.computeIfAbsent(
                        habito.getUsuarioId(),
                        id -> usuarioRepository.findById(id).orElse(null));

                // @audit-ok [Fechamento Diário (2) — resolve o fuso do dono do hábito.
                // E0.5.4: a resolução (incluindo fallback para fuso inválido/ausente)
                // agora é responsabilidade única de ZonaUsuario.resolver — este job não
                // chama ZoneId.of diretamente.]
                final var zona = ZonaUsuario.resolver(usuario);
                final var hoje = LocalDate.now(zona);

                // @audit-ok [Fechamento Diário (3) — o UPDATE só afeta linhas cujo
                // ultimo_reset é anterior a hoje, então repetir a execução é inofensivo]
                final var linhasAfetadas = statusHabitoRepository.resetarDiario(habito.getId(), hoje);
                resetados += linhasAfetadas;

                // @audit-ok [E2.1 (item 3) — só recalcula proximo_vencimento quando o dia
                // realmente virou PARA ESTE hábito nesta passada (linhasAfetadas > 0);
                // resetarDiario devolve 0 quando já tinha sido apurado antes, e recalcular
                // de novo empurraria o vencimento pra frente sem necessidade a cada hora.]
                if (linhasAfetadas > 0) {
                    statusHabitoRepository.findById(habito.getId()).ifPresent(status -> {
                        // @audit-ok [E2.8 (item 4) — execucoesHoje já está zerado aqui
                        // (resetarDiario acabou de rodar, linhasAfetadas > 0 confirma);
                        // calcular() usa isso pra apontar pra 1ª ocorrência do dia novo.]
                        status.setProximoVencimento(
                                proximoVencimentoService.calcular(habito, usuario, status.getExecucoesHoje()));
                        statusHabitoRepository.update(status);
                        // @audit-ok [E2.3 (item 2) — a progressão só é avaliada quando o dia
                        // realmente virou para este hábito nesta passada, pela mesma razão do
                        // recálculo de proximo_vencimento acima: dias_seguidos só fica "fechado"
                        // (não vai mais mudar por causa do dia que terminou) depois da virada.]
                        aplicarProgressaoDeMeta(habito, status);
                    });
                }
            } catch (final Exception e) {
                // Um hábito problemático não pode interromper a apuração dos demais.
                log.warn("Falha ao apurar virada de dia do hábito {}: {}", habito.getId(), e.getMessage());
            }
        }

        if (resetados > 0) {
            log.info("Fechamento diário: {} hábito(s) tiveram os contadores diários zerados.", resetados);
        }
    }

    // @audit-ok [E2.3 (item 2) — progressão automática de meta. hab_incremento=0
    // (default do schema) desliga a progressão de propósito — ver comentário em
    // COLUMN habitos.hab_incremento no schema.sql. dias_seguidos > 0 e múltiplo
    // de dias_incremento é o gatilho: por exemplo, dias_incremento=10 aumenta a
    // meta quando a ofensiva bate exatamente 10, 20, 30 dias etc. Respeitar o
    // teto (meta_maxima) e não regredir/repetir quando já estiver nele.]
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
        habitoRepository.update(habito);

        // @audit-ok [Recalcula os sub_alvo com a meta nova, preservando a
        // quantidade de ocorrências ao dia e os horários já configurados — mesma
        // operação de deletar+recriar que HabitoService.atualizarHabito já faz
        // ao editar um hábito, só que disparada pelo job em vez de por um PUT.
        //
        // E2.8 — achado ao introduzir horário por ocorrência: antes desta tarefa,
        // esta chamada usava só o horário da 1ª sub_atividade pra todas as novas
        // (correto até então, porque todas realmente compartilhavam o mesmo
        // horário). Se eu deixasse assim, toda progressão de meta colapsaria de
        // volta os horários distintos de cada ocorrência pro horário da primeira.
        // Agora repassa o horário de CADA sub_atividade existente pra sua
        // respectiva posição na lista nova.]
        final var subAtividadesAtuais = subAtividadeRepository.findAllByHabitoId(habito.getId());
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
