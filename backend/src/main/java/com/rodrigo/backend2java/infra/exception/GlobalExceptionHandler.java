package com.rodrigo.backend2java.infra.exception;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import java.util.regex.Pattern;
import jakarta.validation.ConstraintViolation;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import com.rodrigo.backend2java.infra.i18n.MensagemTraduzivel;
import com.rodrigo.backend2java.infra.i18n.Mensagens;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // @note - 13.5 (Cadastro) Exception genérico: HTTP 500, mensagem fixa "Erro interno no
    // servidor.". Cobre qualquer falha não prevista nos outros handlers (ex.: o próprio banco
    // fora do ar) durante o cadastro. Ver README §8 > Cadastro > item 13.
    @ExceptionHandler(Exception.class)
    public ResponseEntity<MessageResponseDTO> handleGenericException(Exception ex) {
        return resposta(HttpStatus.INTERNAL_SERVER_ERROR, texto("erro.interno"));
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<MessageResponseDTO> handleRotaInexistente(NoResourceFoundException ex) {
        return resposta(HttpStatus.NOT_FOUND, texto("erro.rotaNaoEncontrada"));
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<MessageResponseDTO> handleMetodoNaoSuportado(HttpRequestMethodNotSupportedException ex) {
        return resposta(HttpStatus.METHOD_NOT_ALLOWED, texto("erro.metodoNaoAceito", ex.getMethod()));
    }

    @ExceptionHandler(RecursoNaoEncontradoException.class)
    public ResponseEntity<MessageResponseDTO> handleRecursoNaoEncontrado(RecursoNaoEncontradoException ex) {
        return resposta(HttpStatus.NOT_FOUND, traduzir(ex));
    }

    // @note - 13.2 (Cadastro) RegraDeNegocioException: HTTP 422. Cobre e-mail duplicado
    // (AuthService.cadastrar, item 7.1a) e o throttle de reenvio de código
    // (CodigoVerificacaoService.gerarCodigo, item 10.1).
    @ExceptionHandler(RegraDeNegocioException.class)
    public ResponseEntity<MessageResponseDTO> handleRegraDeNegocio(RegraDeNegocioException ex) {
        return resposta(HttpStatus.UNPROCESSABLE_ENTITY, traduzir(ex));
    }

    // @note - 13.3 (Cadastro) ValidacaoException: HTTP 400. Cobre senha fora dos critérios do
    // servidor (SenhaValidator.motivoInvalida, item 8.1).
    @ExceptionHandler(ValidacaoException.class)
    public ResponseEntity<MessageResponseDTO> handleValidacao(ValidacaoException ex) {
        return resposta(HttpStatus.BAD_REQUEST, traduzir(ex));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<MessageResponseDTO> handleTipoDeParametro(MethodArgumentTypeMismatchException ex) {
        return resposta(HttpStatus.BAD_REQUEST, texto("erro.parametroInvalido", ex.getName()));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<MessageResponseDTO> handleRuntimeException(RuntimeException ex) {
        return resposta(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<MessageResponseDTO> handleBadCredentialsException(BadCredentialsException ex) {
        return resposta(HttpStatus.UNAUTHORIZED, texto("auth.credenciaisInvalidas"));
    }

    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<MessageResponseDTO> handleDisabledException(DisabledException ex) {
        return resposta(HttpStatus.FORBIDDEN, texto("auth.emailNaoVerificado"));
    }

    // @note - 13.1 (Cadastro) MethodArgumentNotValidException: HTTP 400. Cobre
    // nome/email/password vazios (bean validation do RegisterRequestDTO, item 5.1) quando quem
    // chama a API não faz a validação client-side (Login/validation.js, item 2.1). As anotações
    // trazem a chave entre chaves, como "{validacao.nome.obrigatorio}", traduzida aqui.
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<MessageResponseDTO> handleValidationException(MethodArgumentNotValidException ex) {
        final var mensagem = ex.getBindingResult().getFieldErrors().stream()
                .map(this::textoDoCampo)
                .filter(msg -> msg != null && !msg.isBlank())
                .distinct()
                .collect(Collectors.joining("; "));
        return resposta(HttpStatus.BAD_REQUEST, !mensagem.isBlank() ? mensagem : texto("erro.dadosInvalidos"));
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<MessageResponseDTO> handleMissingParameter(MissingServletRequestParameterException ex) {
        return resposta(HttpStatus.BAD_REQUEST, texto("erro.parametroAusente", ex.getParameterName()));
    }

    // @note - 13.4 (Cadastro) DataIntegrityViolationException: HTTP 400. Cobre qualquer restrição
    // de banco violada que passou pelas validações de aplicação, como a corrida de e-mail
    // duplicado (UsuarioRepository.save, item 9.2) ou um nome maior que usu_nome VARCHAR(150)
    // (Login/validation.js, item 2.1).
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<MessageResponseDTO> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        final var causaRaiz = ex.getMostSpecificCause() != null ? ex.getMostSpecificCause().getMessage() : "";
        return resposta(HttpStatus.BAD_REQUEST, texto(chaveDaRestricao(causaRaiz == null ? "" : causaRaiz)));
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
                ? texto("erro.campoDesconhecido", campoDesconhecido.group(1))
                : texto("erro.corpoInvalido");
        return resposta(HttpStatus.BAD_REQUEST, mensagem);
    }

    // @audit-issue - 13.4 (Cadastro) [outcome: fixed] mensagemAmigavelParaRestricao não tinha um
    // caso para a restrição UNIQUE de usu_email: uma corrida entre dois cadastros simultâneos com
    // o mesmo e-mail caía na mensagem genérica do fim do método, em vez de repetir a mensagem
    // específica que o próprio cadastro já dá quando detecta o mesmo problema antes de tentar
    // salvar (AuthService.cadastrar, item 7.1a). O caso de usu_nome longo demais não precisou de
    // um branch aqui: o @Size(max=150) adicionado em RegisterRequestDTO.java (item 5.1) já barra
    // isso antes de chegar a violar a restrição de banco.
    private String chaveDaRestricao(final String causaRaiz) {
        if (causaRaiz.contains("usu_email")) {
            return "auth.emailEmUso";
        }
        if (causaRaiz.contains("ck_hab_teto")) {
            return "habito.tetoMenorQueMeta";
        }
        if (causaRaiz.contains("ck_hab_incremento")) {
            return "validacao.incremento.negativo";
        }
        if (causaRaiz.contains("ck_hab_dias_incr")) {
            return "validacao.diasIncremento.minimo";
        }
        if (causaRaiz.contains("ck_hab_freq")) {
            return "habito.semDiaMarcado";
        }
        if (causaRaiz.contains("ck_usu_tema")) {
            return "perfil.temaInvalidoRestricao";
        }
        return "erro.restricaoDoBanco";
    }

    private String textoDoCampo(final FieldError erro) {
        try {
            final var violacao = erro.unwrap(ConstraintViolation.class);
            final var modelo = violacao.getMessageTemplate();
            if (modelo != null && modelo.startsWith("{") && modelo.endsWith("}")) {
                final var traduzido = Mensagens.seExistir(LocaleContextHolder.getLocale(),
                        modelo.substring(1, modelo.length() - 1));
                if (traduzido != null) {
                    return traduzido;
                }
            }
        } catch (final IllegalArgumentException semViolacao) {
            // Erro de binding sem ConstraintViolation: fica a mensagem padrão.
        }
        return erro.getDefaultMessage();
    }

    private static String traduzir(final MensagemTraduzivel ex) {
        return texto(ex.getChave(), ex.getArgs());
    }

    private static String texto(final String chave, final Object... args) {
        return Mensagens.daRequisicao(chave, args);
    }

    private static ResponseEntity<MessageResponseDTO> resposta(final HttpStatus status, final String mensagem) {
        return ResponseEntity.status(status)
                .body(MessageResponseDTO.builder().success(false).message(mensagem).build());
    }
}
