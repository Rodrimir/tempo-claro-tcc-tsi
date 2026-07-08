package com.rodrigo.backend.controller;

import java.util.Map;
import java.util.UUID;
import java.util.List;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.rodrigo.backend.service.HabitoService;
import com.rodrigo.backend.service.GamificacaoService;
import com.rodrigo.backend.service.ConclusaoDiaService;
import com.rodrigo.backend.model.dto.request.HabitoRequestDTO;
import com.rodrigo.backend.model.dto.response.HabitoResponseDTO;
import com.rodrigo.backend.model.dto.request.ExecutionRequestDTO;
import com.rodrigo.backend.model.dto.response.PrimingResponseDTO;
import org.springframework.security.core.context.SecurityContextHolder;
import com.rodrigo.backend.model.dto.response.ExecutionResponseDTO;

// @audit-ok [Dashboard(1) / Criar Hábito(1) / Priming(1) / Execução(1) / Loja(1) — controller principal de hábitos]

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class HabitoController {

    private final HabitoService habitoService;
    private final GamificacaoService gamificacaoService;
    private final ConclusaoDiaService conclusaoDiaService;

    // @audit-info [Verificação de Token (11) — requisição já autenticada chega ao controller: o email vem do SecurityContext preenchido no passo 10; encerra o fluxo de verificação e inicia o Dashboard]
    // @audit-ok [Dashboard(1) — extrai email do SecurityContext e retorna hábitos ativos do usuário]
    @GetMapping("/dashboard")
    public ResponseEntity<List<HabitoResponseDTO>> getDashboard() {
        final var emailContexto = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(habitoService.listarDashboard(emailContexto));
    }

    // @audit-ok [Criar Hábito(1) — cria novo hábito para o usuário autenticado]
    @PostMapping("/habits")
    public ResponseEntity<HabitoResponseDTO> createHabit(@Valid @RequestBody final HabitoRequestDTO request) {
        final var emailContexto = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.status(HttpStatus.CREATED).body(habitoService.criarHabito(emailContexto, request));
    }

    // @audit-ok [Atualizar Hábito(1) — atualiza campos editáveis de um hábito existente]
    @PutMapping("/habits/{id}")
    public ResponseEntity<Map<String, Boolean>> updateHabit(@PathVariable final UUID id,
            @RequestBody final HabitoRequestDTO request) {
        habitoService.atualizarHabito(id, request);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // @audit-ok [Deletar Hábito(1) — arquiva hábito com soft delete; preserva histórico]
    @DeleteMapping("/habits/{id}")
    public ResponseEntity<Map<String, Boolean>> deleteHabit(@PathVariable final UUID id) {
        habitoService.deletarHabito(id);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // @audit-ok [Priming(1) — retorna texto motivacional da biblioteca para a categoria do hábito]
    @GetMapping("/habits/{id}/priming")
    public ResponseEntity<PrimingResponseDTO> getPriming(@PathVariable final UUID id) {
        return ResponseEntity.ok(gamificacaoService.obterPriming(id));
    }

    // @audit-ok [Execução(1) — processa conclusão ou falha de uma execução do hábito]
    @PostMapping("/habits/{id}/executions")
    public ResponseEntity<ExecutionResponseDTO> executeHabit(@PathVariable final UUID id,
            @Valid @RequestBody final ExecutionRequestDTO request) {
        return ResponseEntity.ok(gamificacaoService.processarExecucao(id, request));
    }

    // @audit-ok [Loja(1) — compra 1 escudo debitando 1500 moedas; retorna saldo atualizado e inventário de escudos]
    @PostMapping("/habits/{id}/shield")
    public ResponseEntity<Map<String, Integer>> buyShield(@PathVariable final UUID id) {
        return ResponseEntity.ok(gamificacaoService.comprarEscudo(id));
    }

    // @audit-ok [Concluir Dia(1) — encerra o dia corrente e apura/credita a recompensa (F04 "Concluir Hoje")]
    @PostMapping("/habits/{id}/conclude-day")
    public ResponseEntity<ExecutionResponseDTO> concludeDay(@PathVariable final UUID id) {
        return ResponseEntity.ok(conclusaoDiaService.concluirDia(id));
    }
}