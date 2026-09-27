package com.rodrigo.backend2java.infra.exception;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import java.util.regex.Pattern;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // @note - 13.5 (Cadastro) Exception genérico: HTTP 500, mensagem fixa "Erro interno no
    // servidor.". Cobre qualquer falha não prevista nos outros handlers (ex.: o próprio banco
    // fora do ar) durante o cadastro. Ver README §8 > Cadastro > item 13.
    @ExceptionHandler(Exception.class)
    public ResponseEntity<MessageResponseDTO> handleGenericException(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(MessageResponseDTO.builder().success(false).message("Erro interno no servidor.").build());
    }


    @ExceptionHandler(RecursoNaoEncontradoException.class)
    public ResponseEntity<MessageResponseDTO> handleRecursoNaoEncontrado(RecursoNaoEncontradoException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(MessageResponseDTO.builder().success(false).message(ex.getMessage()).build());
    }

    // @note - 13.2 (Cadastro) RegraDeNegocioException: HTTP 422. Cobre e-mail duplicado
    // (AuthService.cadastrar, item 7.1a) e o throttle de reenvio de código
    // (CodigoVerificacaoService.gerarCodigo, item 10.1).
    @ExceptionHandler(RegraDeNegocioException.class)
    public ResponseEntity<MessageResponseDTO> handleRegraDeNegocio(RegraDeNegocioException ex) {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                .body(MessageResponseDTO.builder().success(false).message(ex.getMessage()).build());
    }

    // @note - 13.3 (Cadastro) ValidacaoException: HTTP 400. Cobre senha fora dos critérios do
    // servidor (SenhaValidator.motivoInvalida, item 8.1).
    @ExceptionHandler(ValidacaoException.class)
    public ResponseEntity<MessageResponseDTO> handleValidacao(ValidacaoException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(MessageResponseDTO.builder().success(false).message(ex.getMessage()).build());
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<MessageResponseDTO> handleRuntimeException(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(MessageResponseDTO.builder().success(false).message(ex.getMessage()).build());
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<MessageResponseDTO> handleBadCredentialsException(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(MessageResponseDTO.builder().success(false).message("Erro credenciais invalidas!").build());
    }

    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<MessageResponseDTO> handleDisabledException(DisabledException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(MessageResponseDTO.builder().success(false)
                        .message("E-mail ainda não verificado. Confirme o código enviado para poder entrar.").build());
    }

    // @note - 13.1 (Cadastro) MethodArgumentNotValidException: HTTP 400. Cobre
    // nome/email/password vazios (bean validation do RegisterRequestDTO, item 5.1) quando quem
    // chama a API não faz a validação client-side (Login/validation.js, item 2.1).
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<MessageResponseDTO> handleValidationException(MethodArgumentNotValidException ex) {
        final var mensagem = ex.getBindingResult().getFieldErrors().stream()
                .map(erro -> erro.getDefaultMessage())
                .filter(msg -> msg != null && !msg.isBlank())
                .distinct()
                .collect(Collectors.joining("; "));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(MessageResponseDTO.builder().success(false)
                        .message(!mensagem.isBlank() ? mensagem : "Dados inválidos na requisição.").build());
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<MessageResponseDTO> handleMissingParameter(MissingServletRequestParameterException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(MessageResponseDTO.builder().success(false)
                        .message("Parâmetro obrigatório ausente: " + ex.getParameterName()).build());
    }

    // @note - 13.4 (Cadastro) DataIntegrityViolationException: HTTP 400. Cobre qualquer restrição
    // de banco violada que passou pelas validações de aplicação, como a corrida de e-mail
    // duplicado (UsuarioRepository.save, item 9.2) ou um nome maior que usu_nome VARCHAR(150)
    // (Login/validation.js, item 2.1).
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<MessageResponseDTO> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        final var causaRaiz = ex.getMostSpecificCause() != null ? ex.getMostSpecificCause().getMessage() : "";
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(MessageResponseDTO.builder().success(false)
                        .message(mensagemAmigavelParaRestricao(causaRaiz)).build());
    }

    private static final Pattern CAMPO_DESCONHECIDO = Pattern.compile("Unrecognized property \"([^\"]+)\"");

    // @note - 13.6 (Cadastro) HttpMessageNotReadableException: HTTP 400. Cobre corpo da
    // requisição malformado (JSON inválido ou campo com tipo errado) antes mesmo da validação de
    // bean do item 13.1 rodar.
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<MessageResponseDTO> handleMensagemNaoLegivel(HttpMessageNotReadableException ex) {
        final var causaRaiz = ex.getMostSpecificCause() != null ? ex.getMostSpecificCause().getMessage() : "";
        final var campoDesconhecido = CAMPO_DESCONHECIDO.matcher(causaRaiz == null ? "" : causaRaiz);
        final var mensagem = campoDesconhecido.find()
                ? "Campo desconhecido no corpo da requisição: " + campoDesconhecido.group(1)
                : "Corpo da requisição inválido ou malformado.";
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(MessageResponseDTO.builder().success(false).message(mensagem).build());
    }

    // @audit-issue - 13.4 (Cadastro) [outcome: fixed] mensagemAmigavelParaRestricao não tinha um
    // caso para a restrição UNIQUE de usu_email: uma corrida entre dois cadastros simultâneos com
    // o mesmo e-mail caía na mensagem genérica do fim do método, em vez de repetir a mensagem
    // específica que o próprio cadastro já dá quando detecta o mesmo problema antes de tentar
    // salvar (AuthService.cadastrar, item 7.1a). O caso de usu_nome longo demais não precisou de
    // um branch aqui: o @Size(max=150) adicionado em RegisterRequestDTO.java (item 5.1) já barra
    // isso antes de chegar a violar a restrição de banco.
    private String mensagemAmigavelParaRestricao(final String causaRaiz) {
        if (causaRaiz.contains("usu_email")) {
            return "E-mail já está em uso";
        }
        if (causaRaiz.contains("ck_hab_teto")) {
            return "A meta máxima não pode ser menor que a meta base.";
        }
        if (causaRaiz.contains("ck_hab_incremento")) {
            return "O incremento não pode ser negativo.";
        }
        if (causaRaiz.contains("ck_hab_dias_incr")) {
            return "O incremento deve se repetir a cada 1 dia ou mais.";
        }
        if (causaRaiz.contains("ck_hab_freq")) {
            return "A frequência semanal precisa ter pelo menos um dia marcado.";
        }
        if (causaRaiz.contains("ck_usu_tema")) {
            return "Tema inválido. Use 'claro', 'escuro' ou 'sistema'.";
        }
        return "Os dados enviados violam uma restrição do banco de dados.";
    }
}
