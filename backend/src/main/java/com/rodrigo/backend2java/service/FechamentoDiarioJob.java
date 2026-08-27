package com.rodrigo.backend2java.service;

import java.time.ZoneId;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import com.rodrigo.backend2java.util.ZonaUsuario;
import com.rodrigo.backend2java.repository.HabitoRepository;
import com.rodrigo.backend2java.repository.StatusHabitoRepository;
import com.rodrigo.backend2java.repository.UsuarioRepository;

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

    // @audit-ok [Fechamento Diário (1) — varre os hábitos ativos e apura a virada de dia]
    @Scheduled(fixedRate = 3_600_000L, initialDelay = 60_000L)
    public void resetarContadoresDiarios() {
        final var habitos = habitoRepository.findAllAtivos();
        if (habitos.isEmpty()) {
            return;
        }

        // Cache por usuário: vários hábitos costumam pertencer ao mesmo dono, e sem
        // isso o job faria um SELECT em usuarios por hábito.
        final Map<UUID, ZoneId> fusoPorUsuario = new HashMap<>();
        var resetados = 0;

        for (final var habito : habitos) {
            try {
                // @audit-ok [Fechamento Diário (2) — resolve o fuso do dono do hábito.
                // E0.5.4: a resolução (incluindo fallback para fuso inválido/ausente)
                // agora é responsabilidade única de ZonaUsuario.resolver — este job não
                // chama ZoneId.of diretamente.]
                final var zona = fusoPorUsuario.computeIfAbsent(
                        habito.getUsuarioId(),
                        id -> ZonaUsuario.resolver(usuarioRepository.findById(id).orElse(null)));

                final var hoje = LocalDate.now(zona);

                // @audit-ok [Fechamento Diário (3) — o UPDATE só afeta linhas cujo
                // ultimo_reset é anterior a hoje, então repetir a execução é inofensivo]
                resetados += statusHabitoRepository.resetarDiario(habito.getId(), hoje);
            } catch (final Exception e) {
                // Um hábito problemático não pode interromper a apuração dos demais.
                log.warn("Falha ao apurar virada de dia do hábito {}: {}", habito.getId(), e.getMessage());
            }
        }

        if (resetados > 0) {
            log.info("Fechamento diário: {} hábito(s) tiveram os contadores diários zerados.", resetados);
        }
    }
}
