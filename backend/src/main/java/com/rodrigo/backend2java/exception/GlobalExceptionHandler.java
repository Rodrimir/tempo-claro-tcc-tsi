package com.rodrigo.backend2java.exception;
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
import com.rodrigo.backend2java.model.dto.response.MessageResponseDTO;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // @audit-ok [Execução Timer — Exception genérica retorna 500 com mensagem genérica, sem detalhes internos]
    @ExceptionHandler(Exception.class)
    public ResponseEntity<MessageResponseDTO> handleGenericException(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(MessageResponseDTO.builder().success(false).message("Erro interno no servidor.").build());
    }

    // @audit-ok [Criar Hábito / Loja Escudo — RuntimeException retorna 400 com a mensagem de negócio]
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<MessageResponseDTO> handleRuntimeException(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(MessageResponseDTO.builder().success(false).message(ex.getMessage()).build());
    }

    // @audit-ok [Login / Login — IllegalArgumentException retorna 401 para credenciais inválidas]
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<MessageResponseDTO> handleIllegalArgumentException(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(MessageResponseDTO.builder().success(false).message(ex.getMessage()).build());
    }

    // @audit-ok [Criar Hábito / Execução Timer — MethodArgumentNotValidException retorna 400 para falhas de @Valid]
    //
    // @audit-ok [E2.6 (item 6) — antes devolvia sempre "Dados inválidos na
    // requisição.", não importa qual @NotBlank/@Min/@Size tivesse falhado. As
    // anotações já tinham mensagens específicas em português (ver
    // HabitoRequestDTO) — só não chegavam ao cliente. Passa a juntar as
    // mensagens reais de cada campo que falhou; afeta todo DTO com @Valid no
    // projeto, não só hábitos (RegisterRequestDTO, ExecutionRequestDTO etc.),
    // o que é desejável — nenhum deles deveria devolver mensagem genérica.]
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

    // @audit-ok [E2.2 — achado ao testar: MissingServletRequestParameterException
    // (query param @RequestParam obrigatório ausente, ex.: GET /stats/weekly sem
    // habitoId) não é RuntimeException nesta versão do Spring — sem este handler
    // específico ela caía no handleGenericException genérico e virava 500 em vez
    // de 400.]
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<MessageResponseDTO> handleMissingParameter(MissingServletRequestParameterException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(MessageResponseDTO.builder().success(false)
                        .message("Parâmetro obrigatório ausente: " + ex.getParameterName()).build());
    }

    // @audit-ok [E2.3 (item 4) — antes desta tarefa, hab_meta_maxima/hab_incremento/
    // hab_dias_incremento nunca eram escritos por nenhum fluxo, então os CHECKs
    // ck_hab_teto/ck_hab_incremento/ck_hab_dias_incr eram inalcançáveis. Agora que
    // HabitoRequestDTO os expõe, violar um deles joga uma DataIntegrityViolationException
    // (subclasse de RuntimeException — sem este handler específico, cairia em
    // handleRuntimeException e devolveria a mensagem crua do driver JDBC/Postgres,
    // não uma frase legível.]
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<MessageResponseDTO> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        final var causaRaiz = ex.getMostSpecificCause() != null ? ex.getMostSpecificCause().getMessage() : "";
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(MessageResponseDTO.builder().success(false)
                        .message(mensagemAmigavelParaRestricao(causaRaiz)).build());
    }

    // @audit-ok [E2.9 (item 1) — regex, não a classe UnrecognizedPropertyException:
    // jackson-databind é dependência transitiva "implementation" do
    // spring-boot-starter-web, visível em tempo de execução mas não exposta
    // pra import direto em tempo de compilação neste módulo. Ler o texto da
    // mensagem evita precisar declarar uma dependência nova só por causa de 1
    // classe de exceção.
    //
    // Sem este handler, um campo desconhecido no corpo da requisição cairia no
    // handleRuntimeException (HttpMessageNotReadableException é RuntimeException)
    // com a mensagem técnica crua do Jackson (nome de classe interna, caminho
    // de campo em formato interno etc.), não uma frase legível.]
    // @audit-ok [Confirmado ao testar: a mensagem real do Jackson usa
    // "property", não "field" ("Unrecognized property \"x\" (class ...)").]
    private static final Pattern CAMPO_DESCONHECIDO = Pattern.compile("Unrecognized property \"([^\"]+)\"");

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

    private String mensagemAmigavelParaRestricao(final String causaRaiz) {
        if (causaRaiz.contains("ck_hab_teto")) {
            return "A meta máxima não pode ser menor que a meta base.";
        }
        if (causaRaiz.contains("ck_hab_incremento")) {
            return "O incremento não pode ser negativo.";
        }
        if (causaRaiz.contains("ck_hab_dias_incr")) {
            return "O incremento deve se repetir a cada 1 dia ou mais.";
        }
        // @audit-ok [E2.4 (item 4, backstop) — o frontend já bloqueia 0 dias
        // selecionados antes de enviar; esta mensagem só aparece se alguém
        // chamar a API diretamente contornando essa validação.]
        if (causaRaiz.contains("ck_hab_freq")) {
            return "A frequência semanal precisa ter pelo menos um dia marcado.";
        }
        // @audit-ok [E3.4 — backstop: UsuarioService já valida 'tema' antes de
        // chegar aqui (mesmo padrão de fuso_horario/ZonaUsuario), então esta
        // linha só é alcançável por um caminho que pule essa validação.]
        if (causaRaiz.contains("ck_usu_tema")) {
            return "Tema inválido. Use 'claro', 'escuro' ou 'sistema'.";
        }
        return "Os dados enviados violam uma restrição do banco de dados.";
    }
}
