package com.rodrigo.backend2java.infra.saude;

import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

// Rota pública e leve para o health check do Render e para o ping de keep-alive. Não consulta o
// banco, para não acordar o Neon a cada ping.
@RestController
public class HealthController {

    @GetMapping("/api/health")
    public ResponseEntity<Map<String, String>> saude() {
        return ResponseEntity.ok(Map.of("status", "ok"));
    }
}
