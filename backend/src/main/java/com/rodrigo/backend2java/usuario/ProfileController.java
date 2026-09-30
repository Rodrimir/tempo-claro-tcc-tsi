package com.rodrigo.backend2java.usuario;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.context.SecurityContextHolder;
@RestController
@RequestMapping("/api")
public class ProfileController {

    private final UsuarioService usuarioService;

    public ProfileController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

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
