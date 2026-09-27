package com.rodrigo.backend2java.stats;

import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.context.SecurityContextHolder;
import com.rodrigo.backend2java.stats.model.StatsResponseDTO;

@RestController
@RequestMapping("/api/stats")
public class StatsController {

    private final StatsService statsService;

    public StatsController(StatsService statsService) {
        this.statsService = statsService;
    }

    @GetMapping({ "/monthly", "/weekly" })
    public ResponseEntity<StatsResponseDTO> getStats(@RequestParam final UUID habitoId) {
        final var emailContexto = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(statsService.obterEstatisticas(habitoId, emailContexto));
    }
}
