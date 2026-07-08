package com.rodrigo.backend.controller;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.rodrigo.backend.service.StatsService;
import org.springframework.security.core.context.SecurityContextHolder;
import com.rodrigo.backend.model.dto.response.StatsWeeklyResponseDTO;

// @audit-ok [Estatísticas(1) — controller de stats: GET /stats/weekly retorna dados dos últimos 7 dias por hábito]

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatsController {

    private final StatsService statsService;

    // @audit-ok [Estatísticas(1) — retorna stats semanal de todos os hábitos do usuário autenticado]
    @GetMapping("/weekly")
    public ResponseEntity<List<StatsWeeklyResponseDTO>> getWeeklyStats() {
        final var email = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(statsService.buscarStatsSemanal(email));
    }
}
