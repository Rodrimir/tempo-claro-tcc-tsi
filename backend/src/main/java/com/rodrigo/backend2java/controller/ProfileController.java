package com.rodrigo.backend2java.controller;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.rodrigo.backend2java.service.UsuarioService;
import com.rodrigo.backend2java.model.dto.request.ProfileUpdateDTO;
import org.springframework.security.core.context.SecurityContextHolder;

// @audit-ok [Profile(1) — controller de perfil: PUT /api/profile]

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ProfileController {

    private final UsuarioService usuarioService;

    @PutMapping("profile")
    public ResponseEntity<Map<String, Boolean>> updateProfile(@RequestBody final ProfileUpdateDTO request) {
        final var emailContexto = SecurityContextHolder.getContext().getAuthentication().getName();
        usuarioService.atualizarPerfil(emailContexto, request);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
