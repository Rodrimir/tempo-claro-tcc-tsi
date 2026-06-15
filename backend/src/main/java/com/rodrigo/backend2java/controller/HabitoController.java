package com.rodrigo.backend2java.controller;

import com.rodrigo.backend2java.model.dto.request.ExecutionRequestDTO;
import com.rodrigo.backend2java.model.dto.request.HabitoRequestDTO;
import com.rodrigo.backend2java.model.dto.response.ExecutionResponseDTO;
import com.rodrigo.backend2java.model.dto.response.HabitoResponseDTO;
import com.rodrigo.backend2java.model.dto.response.PrimingResponseDTO;
import com.rodrigo.backend2java.service.GamificacaoService;
import com.rodrigo.backend2java.service.HabitoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class HabitoController {

    private final HabitoService habitoService;
    private final GamificacaoService gamificacaoService;

    // @audit-ok : @Endpoint de listagem@ do dashboard do usuário
    @GetMapping("/dashboard")
    public ResponseEntity<List<HabitoResponseDTO>> getDashboard() {
        final var emailContexto = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(habitoService.listarDashboard(emailContexto));
    }

    // @audit-ok : @Endpoint de criação@ de novo hábito
    @PostMapping("/habits")
    public ResponseEntity<HabitoResponseDTO> createHabit(@Valid @RequestBody final HabitoRequestDTO request) {
        final var emailContexto = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.status(HttpStatus.CREATED).body(habitoService.criarHabito(emailContexto, request));
    }

    // @audit-ok : @Endpoint de atualização@ de hábito existente
    @PutMapping("/habits/{id}")
    public ResponseEntity<Map<String, Boolean>> updateHabit(@PathVariable final UUID id,
            @RequestBody final HabitoRequestDTO request) {
        habitoService.atualizarHabito(id, request);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // @audit-ok : @Endpoint de deleção@ de hábito
    @DeleteMapping("/habits/{id}")
    public ResponseEntity<Map<String, Boolean>> deleteHabit(@PathVariable final UUID id) {
        habitoService.deletarHabito(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // @audit-ok : @Endpoint de resgate@ de priming cognitivo
    @GetMapping("/habits/{id}/priming")
    public ResponseEntity<PrimingResponseDTO> getPriming(@PathVariable final UUID id) {
        return ResponseEntity.ok(gamificacaoService.obterPriming(id));
    }

    // @audit-ok : @Endpoint de execução@ de hábito
    @PostMapping("/habits/{id}/executions")
    public ResponseEntity<ExecutionResponseDTO> executeHabit(@PathVariable final UUID id,
            @Valid @RequestBody final ExecutionRequestDTO request) {
        return ResponseEntity.ok(gamificacaoService.processarExecucao(id, request));
    }

    // @audit-ok : @Endpoint de compra@ de escudo protetor
    @PostMapping("/habits/{id}/shield")
    public ResponseEntity<Map<String, Object>> buyShield(@PathVariable final UUID id) {
        gamificacaoService.comprarEscudo(id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Escudo comprado!"));
    }
}
