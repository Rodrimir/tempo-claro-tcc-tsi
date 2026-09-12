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

    // @audit-ok [Dashboard (1) — extrai email do SecurityContext e busca todos os hábitos do usuário]
    // @audit-ok [E1.3 — resposta envelopada em DashboardResponseDTO (antes era
    // a lista de hábitos crua) para expor limite_habitos_ativos junto, e o
    // front nunca precisar repetir o número do limite por conta própria.]
    @GetMapping("/dashboard")
    public ResponseEntity<DashboardResponseDTO> getDashboard() {
        return ResponseEntity.ok(DashboardResponseDTO.builder()
                .habits(habitoService.listarDashboard(emailContexto()))
                .limite_habitos_ativos(HabitoService.LIMITE_HABITOS_ATIVOS)
                .build());
    }

    // @audit-ok [Criar Hábito (1) — cria novo hábito com status inicial zerado para o usuário autenticado]
    @PostMapping("/habits")
    public ResponseEntity<HabitoResponseDTO> createHabit(@Valid @RequestBody final HabitoRequestDTO request) {
        final var emailContexto = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.status(HttpStatus.CREATED).body(habitoService.criarHabito(emailContexto, request));
    }

    // Todo endpoint por {id} passa o e-mail do token adiante, e o service confere
    // a propriedade do hábito (AcessoHabitoService). Antes disto, o UUID vinha cru
    // pelo path e ninguém olhava o SecurityContext: qualquer usuário autenticado
    // que conhecesse o UUID de um hábito alheio podia executá-lo, comprar escudo,
    // editá-lo ou arquivá-lo — contra RF22 e RNF08.

    // @audit-ok [Atualizar Hábito (1) — atualiza um hábito existente (RF23).
    // E2.9 (item 4) — ganhou @Valid: antes era o único @RequestBody de
    // HabitoRequestDTO sem validação nenhuma, inconsistente com createHabit.]
    @PutMapping("/habits/{id}")
    public ResponseEntity<Map<String, Boolean>> updateHabit(@PathVariable final UUID id,
            @Valid @RequestBody final HabitoRequestDTO request) {
        habitoService.atualizarHabito(id, emailContexto(), request);
        return ResponseEntity.ok(Map.of("success", true));
    }

    // @audit-ok [Deletar Hábito (1) — arquiva (soft delete) o hábito; marca ativo=false]
    @DeleteMapping("/habits/{id}")
    public ResponseEntity<Map<String, Boolean>> deleteHabit(@PathVariable final UUID id) {
        habitoService.deletarHabito(id, emailContexto());
        return ResponseEntity.ok(Map.of("success", true));
    }

    // @audit-ok [Pré-Tarefa Priming (1) — retorna texto motivacional da biblioteca para a categoria do hábito]
    @GetMapping("/habits/{id}/priming")
    public ResponseEntity<PrimingResponseDTO> getPriming(@PathVariable final UUID id) {
        return ResponseEntity.ok(gamificacaoService.obterPriming(id, emailContexto()));
    }

    // @audit-ok [Execução Timer (1) — registra a execução e acumula o realizado do dia]
    @PostMapping("/habits/{id}/executions")
    public ResponseEntity<ExecutionResponseDTO> executeHabit(@PathVariable final UUID id,
            @Valid @RequestBody final ExecutionRequestDTO request) {
        return ResponseEntity.ok(gamificacaoService.processarExecucao(id, emailContexto(), request));
    }

    // @audit-ok [Loja Escudo (1) — compra 1 escudo debitando 1500 moedas do status do hábito]
    @PostMapping("/habits/{id}/shield")
    public ResponseEntity<Map<String, Object>> buyShield(@PathVariable final UUID id) {
        gamificacaoService.comprarEscudo(id, emailContexto());
        return ResponseEntity.ok(Map.of("success", true, "message", "Escudo comprado!"));
    }

    /** O subject do JWT é o e-mail do usuário — ver TokenService. */
    private String emailContexto() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}
