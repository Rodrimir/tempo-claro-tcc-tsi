package com.rodrigo.backend2java.habito;
import java.util.Map;
import java.util.UUID;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.rodrigo.backend2java.execucao.GamificacaoService;
import com.rodrigo.backend2java.execucao.ExecutionRequestDTO;
import com.rodrigo.backend2java.execucao.PrimingResponseDTO;
import org.springframework.security.core.context.SecurityContextHolder;
import com.rodrigo.backend2java.execucao.ExecutionResponseDTO;

@RestController
@RequestMapping("/api")
public class HabitoController {

    private final HabitoService habitoService;
    private final GamificacaoService gamificacaoService;

    public HabitoController(HabitoService habitoService, GamificacaoService gamificacaoService) {
        this.habitoService = habitoService;
        this.gamificacaoService = gamificacaoService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardResponseDTO> getDashboard() {
        return ResponseEntity.ok(DashboardResponseDTO.builder()
                .habits(habitoService.listarDashboard(emailContexto()))
                .limite_habitos_ativos(HabitoService.LIMITE_HABITOS_ATIVOS)
                .custo_escudo(GamificacaoService.CUSTO_ESCUDO)
                .build());
    }

    @PostMapping("/habits")
    public ResponseEntity<HabitoResponseDTO> createHabit(@Valid @RequestBody final HabitoRequestDTO request) {
        final var emailContexto = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.status(HttpStatus.CREATED).body(habitoService.criarHabito(emailContexto, request));
    }


    @PutMapping("/habits/{id}")
    public ResponseEntity<Map<String, Boolean>> updateHabit(@PathVariable final UUID id,
            @Valid @RequestBody final HabitoRequestDTO request) {
        habitoService.atualizarHabito(id, emailContexto(), request);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @DeleteMapping("/habits/{id}")
    public ResponseEntity<Map<String, Boolean>> deleteHabit(@PathVariable final UUID id) {
        habitoService.deletarHabito(id, emailContexto());
        return ResponseEntity.ok(Map.of("success", true));
    }

    @GetMapping("/habits/{id}/priming")
    public ResponseEntity<PrimingResponseDTO> getPriming(@PathVariable final UUID id) {
        return ResponseEntity.ok(gamificacaoService.obterPriming(id, emailContexto()));
    }

    @PostMapping("/habits/{id}/executions")
    public ResponseEntity<ExecutionResponseDTO> executeHabit(@PathVariable final UUID id,
            @Valid @RequestBody final ExecutionRequestDTO request) {
        return ResponseEntity.ok(gamificacaoService.processarExecucao(id, emailContexto(), request));
    }

    @PostMapping("/habits/{id}/shield")
    public ResponseEntity<Map<String, Object>> buyShield(@PathVariable final UUID id) {
        gamificacaoService.comprarEscudo(id, emailContexto());
        return ResponseEntity.ok(Map.of("success", true, "message", "Escudo comprado!"));
    }

    private String emailContexto() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}
