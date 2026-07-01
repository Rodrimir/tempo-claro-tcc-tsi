package com.rodrigo.backend2java.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;


@RestController
@RequestMapping("/api/stats")
public class StatsController {

    // @audit-ok [Estatísticas (1) — stub: retorna lista vazia até implementação completa do cálculo semanal]
    @GetMapping("/weekly")
    public ResponseEntity<List<Object>> getWeeklyStats() {
        return ResponseEntity.ok(new ArrayList<>());
    }
}
