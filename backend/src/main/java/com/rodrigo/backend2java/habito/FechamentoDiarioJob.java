package com.rodrigo.backend2java.habito;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import com.rodrigo.backend2java.usuario.model.Usuario;
import com.rodrigo.backend2java.usuario.UsuarioRepository;

@Component
public class FechamentoDiarioJob {

    private static final Logger log = LoggerFactory.getLogger(FechamentoDiarioJob.class);

    private final HabitoRepository habitoRepository;
    private final UsuarioRepository usuarioRepository;
    private final ApuracaoService apuracaoService;

    public FechamentoDiarioJob(HabitoRepository habitoRepository, UsuarioRepository usuarioRepository, ApuracaoService apuracaoService) {
        this.habitoRepository = habitoRepository;
        this.usuarioRepository = usuarioRepository;
        this.apuracaoService = apuracaoService;
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
                if (usuario == null) {
                    log.warn("Hábito {} sem dono no banco (usuário {}): fechamento pulado.",
                            habito.getId(), habito.getUsuarioId());
                    continue;
                }

                diasApurados += apuracaoService.apurarAteHoje(habito.getId(), usuario).diasApurados();
            } catch (final Exception e) {
                log.warn("Falha ao apurar virada de dia do hábito {}: {}", habito.getId(), e.getMessage());
            }
        }

        if (diasApurados > 0) {
            log.info("Fechamento diário: {} dia(s) apurado(s).", diasApurados);
        }
    }
}
