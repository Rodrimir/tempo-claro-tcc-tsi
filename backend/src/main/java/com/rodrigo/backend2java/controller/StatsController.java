package com.rodrigo.backend2java.controller;

import java.util.List;
import java.util.ArrayList;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stats")
public class StatsController {

    // @audit-ok [Estatísticas (1) — stub: retorna lista vazia até implementação completa do cálculo semanal]
    @GetMapping("/weekly")
    public ResponseEntity<List<Object>> getWeeklyStats() {
        return ResponseEntity.ok(new ArrayList<>());
    }
}
