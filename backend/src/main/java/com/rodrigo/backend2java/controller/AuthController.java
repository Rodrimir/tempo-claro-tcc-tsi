package com.rodrigo.backend2java.controller;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.rodrigo.backend2java.service.AuthService;
import com.rodrigo.backend2java.model.dto.request.LoginRequestDTO;
import com.rodrigo.backend2java.model.dto.response.AuthResponseDTO;
import com.rodrigo.backend2java.model.dto.request.RegisterRequestDTO;


@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
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


