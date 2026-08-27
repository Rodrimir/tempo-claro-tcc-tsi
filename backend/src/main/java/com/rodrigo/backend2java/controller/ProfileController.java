package com.rodrigo.backend2java.controller;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.rodrigo.backend2java.service.UsuarioService;
import com.rodrigo.backend2java.model.dto.request.ProfileUpdateDTO;
import com.rodrigo.backend2java.model.dto.response.UsuarioResponseDTO;
import org.springframework.security.core.context.SecurityContextHolder;
// @audit-ok [Profile(1) — controller de perfil: GET /api/me e PUT /api/profile]
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ProfileController {

    private final UsuarioService usuarioService;

    // @audit-ok [E1.5 (item 1) — devolve id, nome, email, fuso_horario e
    // preferencia_idioma do usuário autenticado. Existe porque a resposta de
    // login só trazia nome/email — o Perfil não tinha de onde ler o fuso salvo
    // sem essa consulta.]
    @GetMapping("/me")
    public ResponseEntity<UsuarioResponseDTO> getMe() {
        final var emailContexto = SecurityContextHolder.getContext().getAuthentication().getName();
        return ResponseEntity.ok(usuarioService.buscarPerfil(emailContexto));
    }

    @PutMapping("profile")
    public ResponseEntity<Map<String, Boolean>> updateProfile(@RequestBody final ProfileUpdateDTO request) {
        final var emailContexto = SecurityContextHolder.getContext().getAuthentication().getName();
        usuarioService.atualizarPerfil(emailContexto, request);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
