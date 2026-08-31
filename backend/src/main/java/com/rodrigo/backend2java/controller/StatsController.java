package com.rodrigo.backend2java.controller;

import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import com.rodrigo.backend2java.service.StatsService;
import com.rodrigo.backend2java.model.dto.response.StatsResponseDTO;
import org.springframework.security.core.context.SecurityContextHolder;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatsController {

    private final StatsService statsService;

    // @audit-ok [E2.2 — antes era um stub literal: "return new ArrayList<>()"
    // direto aqui, sem service nem repository, e sem receber o hábito de forma
    // alguma. Agora exige habitoId (query param obrigatório — sem @RequestParam
    // "required=false", então a ausência já responde 400 pelo próprio Spring)
    // e delega todo o cálculo a StatsService.]
    @GetMapping("/weekly")
    public ResponseEntity<StatsResponseDTO> getWeeklyStats(@RequestParam final UUID habitoId) {
        final var emailContexto = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(statsService.obterEstatisticasSemanais(habitoId, emailContexto));
    }
}
