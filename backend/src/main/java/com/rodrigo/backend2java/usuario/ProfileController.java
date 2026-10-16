package com.rodrigo.backend2java.usuario;
import java.util.Map;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.context.SecurityContextHolder;
import com.rodrigo.backend2java.usuario.model.ExclusaoContaDTO;
import com.rodrigo.backend2java.usuario.model.PreferenciasIniciaisDTO;
import com.rodrigo.backend2java.usuario.model.ProfileUpdateDTO;
import com.rodrigo.backend2java.usuario.model.UsuarioResponseDTO;
@RestController
@RequestMapping("/api")
public class ProfileController {

    private final UsuarioService usuarioService;

    public ProfileController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @GetMapping("/me")
    public ResponseEntity<UsuarioResponseDTO> getMe() {
        return ResponseEntity.ok(usuarioService.buscarPerfil(emailContexto()));
    }

    @PutMapping("profile")
    public ResponseEntity<Map<String, Boolean>> updateProfile(@RequestBody final ProfileUpdateDTO request) {
        usuarioService.atualizarPerfil(emailContexto(), request);
        return ResponseEntity.ok(Map.of("success", true));
    }

    @PostMapping("/me/onboarding/preferencias")
    public ResponseEntity<UsuarioResponseDTO> definirPreferenciasIniciais(
            @Valid @RequestBody final PreferenciasIniciaisDTO request) {
        return ResponseEntity.ok(usuarioService.definirPreferenciasIniciais(emailContexto(), request));
    }

    @PostMapping("/me/onboarding/concluir")
    public ResponseEntity<UsuarioResponseDTO> concluirOnboarding() {
        return ResponseEntity.ok(usuarioService.concluirOnboarding(emailContexto()));
    }

    @DeleteMapping("/me")
    public ResponseEntity<Map<String, Boolean>> excluirConta(@RequestBody(required = false) final ExclusaoContaDTO request) {
        usuarioService.excluirConta(emailContexto(), request);
        return ResponseEntity.ok(Map.of("success", true));
    }

    private static String emailContexto() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}
