package com.rodrigo.backend.controller;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.rodrigo.backend.service.UsuarioService;
import com.rodrigo.backend.model.dto.request.ProfileUpdateDTO;
import com.rodrigo.backend.model.dto.request.AccountDeleteDTO;
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

    // @audit-ok [Excluir Conta(1) — controller de perfil: DELETE /api/profile; recebe a senha de confirmação e remove a conta do usuário autenticado]
    @DeleteMapping("profile")
    public ResponseEntity<Map<String, Boolean>> deleteAccount(@RequestBody(required = false) final AccountDeleteDTO request) {
        final var emailContexto = SecurityContextHolder.getContext().getAuthentication().getName();
        usuarioService.excluirConta(emailContexto, request);
        return ResponseEntity.ok(Map.of("success", true));
    }
}
