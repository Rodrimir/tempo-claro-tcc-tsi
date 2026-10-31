package com.rodrigo.backend2java.autenticacao;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.rodrigo.backend2java.infra.exception.MessageResponseDTO;
import com.rodrigo.backend2java.autenticacao.model.AuthResponseDTO;
import com.rodrigo.backend2java.autenticacao.model.LoginRequestDTO;
import com.rodrigo.backend2java.autenticacao.model.RegisterRequestDTO;
import com.rodrigo.backend2java.autenticacao.model.ResendCodeRequestDTO;
import com.rodrigo.backend2java.autenticacao.model.VerifyEmailRequestDTO;
import com.rodrigo.backend2java.autenticacao.model.ResetPasswordRequestDTO;
import com.rodrigo.backend2java.autenticacao.model.ForgotPasswordRequestDTO;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }
    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@Valid @RequestBody final LoginRequestDTO request) {
        return ResponseEntity.ok(authService.autenticar(request));
    }

    // @note - 5.1 (Cadastro) register: valida RegisterRequestDTO (@Valid, ver item 5 no arquivo do
    // DTO) e devolve HTTP 201 com MessageResponseDTO (item 12.1). Qualquer violação de
    // @NotBlank/@Email do DTO nunca chega ao corpo deste método: é interceptada antes pelo
    // MethodArgumentNotValidException (GlobalExceptionHandler.java, item 13.1). Ver README §8 >
    // Cadastro > item 5.
    @PostMapping("/register")
    public ResponseEntity<MessageResponseDTO> register(@Valid @RequestBody final RegisterRequestDTO request) {
        // @note - 12.1 (Cadastro) caminho feliz: HTTP 201 Created, corpo { success: true, message:
        // "Cadastro recebido! ..." } (AuthService.cadastrar, item 7.1).
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


