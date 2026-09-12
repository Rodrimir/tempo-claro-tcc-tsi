package com.rodrigo.backend2java.autenticacao;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }
    // @audit-ok [Login(1) — controller de autenticação: POST /auth/login]
    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@Valid @RequestBody final LoginRequestDTO request) {
        return ResponseEntity.ok(authService.autenticar(request));
    }

    // @audit-ok [Cadastro(1)  — controller de autenticação: POST /auth/register]
    @PostMapping("/register")
    public ResponseEntity<AuthResponseDTO> register(@Valid @RequestBody final RegisterRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.cadastrar(request));
    }
}


