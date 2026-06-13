package com.rodrigo.backend2java.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/v1/stats")
public class StatsController {

    @GetMapping("/weekly")
    public ResponseEntity<List<Object>> getWeeklyStats() {
        // @audit-info: Lógica de agregação pendente. Retornando array vazio por enquanto.
        return ResponseEntity.ok(new ArrayList<>());
    }
}
