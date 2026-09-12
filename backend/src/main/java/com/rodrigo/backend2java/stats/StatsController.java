package com.rodrigo.backend2java.stats;

import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.context.SecurityContextHolder;

@RestController
@RequestMapping("/api/stats")
public class StatsController {

    private final StatsService statsService;

    public StatsController(StatsService statsService) {
        this.statsService = statsService;
    }

    // Exige habitoId (query param obrigatório — sem "required=false", a ausência já
    // responde 400 pelo próprio Spring) e delega todo o cálculo a StatsService.
    //
    // v3.0: a janela virou mensal, então o nome canônico da rota é /monthly.
    // /weekly continua atendendo para o app publicado não quebrar de um lado só —
    // é a mesma resposta, e some quando os clientes migrarem.
    @GetMapping({ "/monthly", "/weekly" })
    public ResponseEntity<StatsResponseDTO> getStats(@RequestParam final UUID habitoId) {
        final var emailContexto = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(statsService.obterEstatisticas(habitoId, emailContexto));
    }
}
