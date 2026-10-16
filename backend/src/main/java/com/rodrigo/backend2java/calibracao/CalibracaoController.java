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
import com.rodrigo.backend2java.calibracao.model.CalibracaoRequestDTO;
import com.rodrigo.backend2java.calibracao.model.CalibracaoResponseDTO;
import com.rodrigo.backend2java.calibracao.model.QuestionarioResponseDTO;

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
