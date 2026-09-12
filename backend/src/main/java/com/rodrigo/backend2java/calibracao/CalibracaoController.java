package com.rodrigo.backend2java.calibracao;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Calibração assistida de metas (RF20/RNF04).
 *
 * <p>Duas rotas: uma devolve o questionário (o app não conhece nenhuma pergunta por
 * nome — só sabe desenhar os cinco tipos de resposta), a outra recebe as respostas
 * e devolve a sugestão. Nenhuma das duas cria hábito: quem cria é
 * {@code POST /habits}, levando o {@code calibracao_id} junto.
 */
@RestController
@RequestMapping("/api/calibration")
public class CalibracaoController {

    private final CalibracaoService calibracaoService;

    public CalibracaoController(CalibracaoService calibracaoService) {
        this.calibracaoService = calibracaoService;
    }

    @GetMapping("/questions")
    public ResponseEntity<QuestionarioResponseDTO> getQuestions(@RequestParam final String categoria) {
        final var emailContexto = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(calibracaoService.obterQuestionario(categoria, emailContexto));
    }

    @PostMapping
    public ResponseEntity<CalibracaoResponseDTO> calibrate(
            @Valid @RequestBody final CalibracaoRequestDTO request) {
        final var emailContexto = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(calibracaoService.calibrar(emailContexto, request));
    }
}
