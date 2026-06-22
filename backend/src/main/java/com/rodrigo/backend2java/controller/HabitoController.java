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

// @audit-ok [Dashboard (5) / Criar Hábito (14) / Pré-Tarefa Priming (10) / Execução Timer (18) / Loja Escudo (10) — controller principal de hábitos]

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class HabitoController {

    private final HabitoService habitoService;
    private final GamificacaoService gamificacaoService;

    // @audit-ok [Dashboard (6) — extrai email do SecurityContext e busca todos os hábitos do usuário]
    @GetMapping("/dashboard")
    public ResponseEntity<List<HabitoResponseDTO>> getDashboard() {
        final var emailContexto = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(habitoService.listarDashboard(emailContexto));
    }

    // @audit-ok [Criar Hábito (15) — cria novo hábito com status inicial zerado para o usuário autenticado]
    @PostMapping("/habits")
    public ResponseEntity<HabitoResponseDTO> createHabit(@Valid @RequestBody final HabitoRequestDTO request) {
        final var emailContexto = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.status(HttpStatus.CREATED).body(habitoService.criarHabito(emailContexto, request));
    }

    // @audit-ok [Atualizar Hábito — atualiza título e meta_base de um hábito existente]
    @PutMapping("/habits/{id}")
    public ResponseEntity<Map<String, Boolean>> updateHabit(@PathVariable final UUID id,
            @RequestBody final HabitoRequestDTO request) {
        habitoService.atualizarHabito(id, request);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // @audit-ok [Deletar Hábito — arquiva (soft delete) o hábito; marca ativo=false]
    @DeleteMapping("/habits/{id}")
    public ResponseEntity<Map<String, Boolean>> deleteHabit(@PathVariable final UUID id) {
        habitoService.deletarHabito(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // @audit-ok [Pré-Tarefa Priming (11) — retorna texto motivacional da biblioteca para a categoria do hábito]
    @GetMapping("/habits/{id}/priming")
    public ResponseEntity<PrimingResponseDTO> getPriming(@PathVariable final UUID id) {
        return ResponseEntity.ok(gamificacaoService.obterPriming(id));
    }

    // @audit-ok [Execução Timer (19) — processa conclusão ou falha e atualiza status de gamificação]
    @PostMapping("/habits/{id}/executions")
    public ResponseEntity<ExecutionResponseDTO> executeHabit(@PathVariable final UUID id,
            @Valid @RequestBody final ExecutionRequestDTO request) {
        return ResponseEntity.ok(gamificacaoService.processarExecucao(id, request));
    }

    // @audit-ok [Loja Escudo (11) — compra 1 escudo debitando 1500 moedas do status do hábito]
    @PostMapping("/habits/{id}/shield")
    public ResponseEntity<Map<String, Object>> buyShield(@PathVariable final UUID id) {
        gamificacaoService.comprarEscudo(id);
        return ResponseEntity.ok(Map.of("success", true, "message", "Escudo comprado!"));
    }
}
