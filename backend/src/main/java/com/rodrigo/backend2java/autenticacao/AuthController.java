package com.rodrigo.backend2java.autenticacao;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.rodrigo.backend2java.infra.exception.MessageResponseDTO;

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
    // PLANO_REESTRUTURACAO.md, C — 201 sem token; o app usa o e-mail que acabou
    // de enviar para ir direto à tela de código em /verify-email.
    @PostMapping("/register")
    public ResponseEntity<MessageResponseDTO> register(@Valid @RequestBody final RegisterRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.cadastrar(request));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<AuthResponseDTO> verificarEmail(@Valid @RequestBody final VerifyEmailRequestDTO request) {
        return ResponseEntity.ok(authService.verificarEmail(request));
    }

    @PostMapping("/resend-code")
    public ResponseEntity<MessageResponseDTO> reenviarCodigo(@Valid @RequestBody final ResendCodeRequestDTO request) {
        return ResponseEntity.ok(authService.reenviarCodigoVerificacao(request));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<MessageResponseDTO> esqueciSenha(@Valid @RequestBody final ForgotPasswordRequestDTO request) {
        return ResponseEntity.ok(authService.esqueciSenha(request));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<AuthResponseDTO> redefinirSenha(@Valid @RequestBody final ResetPasswordRequestDTO request) {
        return ResponseEntity.ok(authService.redefinirSenha(request));
    }
}


