package com.rodrigo.backend.controller;

import java.util.UUID;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.rodrigo.backend.service.SessaoExecucaoService;
import com.rodrigo.backend.model.dto.response.SessaoResponseDTO;
import com.rodrigo.backend.model.dto.request.SessaoPausaRequestDTO;
import com.rodrigo.backend.model.dto.request.SessaoInicioRequestDTO;

// @audit-ok [Execução(1) — controller de sessões: inicia, pausa, retoma e consulta o timer persistido (F09)]

@RestController
@RequestMapping("/api/habits/{habitoId}/sessions")
@RequiredArgsConstructor
public class SessaoController {

    private final SessaoExecucaoService sessaoService;

    // @audit-ok [Execução(1) — inicia sessão de timer para o hábito; retorna 201 com a sessão criada]
    @PostMapping
    public ResponseEntity<SessaoResponseDTO> iniciar(
            @PathVariable UUID habitoId,
            @RequestBody SessaoInicioRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(sessaoService.iniciarSessao(habitoId, request));
    }

    // @audit-ok [Execução(1) — pausa sessão ativa e persiste valor_parcial do timer do cliente]
    @PatchMapping("/{sessaoId}/pause")
    public ResponseEntity<SessaoResponseDTO> pausar(
            @PathVariable UUID habitoId,
            @PathVariable UUID sessaoId,
            @RequestBody SessaoPausaRequestDTO request) {
        return ResponseEntity.ok(sessaoService.pausarSessao(sessaoId, request.valor_parcial()));
    }

    // @audit-ok [Execução(1) — retoma sessão pausada; o timer do cliente continua a partir do valor_parcial salvo]
    @PatchMapping("/{sessaoId}/resume")
    public ResponseEntity<SessaoResponseDTO> retomar(
            @PathVariable UUID habitoId,
            @PathVariable UUID sessaoId) {
        return ResponseEntity.ok(sessaoService.retomarSessao(sessaoId));
    }

    // @audit-ok [Execução(1) — retorna sessão viva do hábito para o app restaurar o timer após minimizar]
    @GetMapping("/active")
    public ResponseEntity<SessaoResponseDTO> obterAtiva(@PathVariable UUID habitoId) {
        final Optional<SessaoResponseDTO> sessao = sessaoService.obterSessaoAtiva(habitoId);
        return sessao.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
