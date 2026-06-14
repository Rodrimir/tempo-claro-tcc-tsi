// @audit-ok: BACKEND-ProfileController.java-01
package com.rodrigo.backend2java.controller;

import com.rodrigo.backend2java.model.dto.request.ProfileUpdateDTO;
import com.rodrigo.backend2java.service.UsuarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final UsuarioService usuarioService;

    @PutMapping
    public ResponseEntity<Map<String, Boolean>> updateProfile(@RequestBody final ProfileUpdateDTO request) {
        final var emailContexto = SecurityContextHolder.getContext().getAuthentication().getName();
        usuarioService.atualizarPerfil(emailContexto, request);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
