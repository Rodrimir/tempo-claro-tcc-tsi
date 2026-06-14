// @audit-ok: BACKEND-AuthController.java-01
package com.rodrigo.backend2java.controller;

import com.rodrigo.backend2java.model.dto.request.LoginRequestDTO;
import com.rodrigo.backend2java.model.dto.request.RegisterRequestDTO;
import com.rodrigo.backend2java.model.dto.response.AuthResponseDTO;
import com.rodrigo.backend2java.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// @audit-ok: BACK-CTRL-00 - Controller de Autenticação Aberto
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // @audit-ok: BACK-CTRL-01 - Endpoint de login e emissão JWT
    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@Valid @RequestBody final LoginRequestDTO request) {
        return ResponseEntity.ok(authService.autenticar(request));
    }

    // @audit-ok: BACK-CTRL-02 - Endpoint de cadastro de novos usuários
    @PostMapping("/register")
    public ResponseEntity<AuthResponseDTO> register(@Valid @RequestBody final RegisterRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.cadastrar(request));
    }
}
