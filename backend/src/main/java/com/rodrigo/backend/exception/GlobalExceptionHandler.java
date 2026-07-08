package com.rodrigo.backend.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.rodrigo.backend.model.dto.response.MessageResponseDTO;

// @audit-ok [GlobalExceptionHandler — centraliza tratamento de erros: nunca vaza stack trace para o cliente]

@RestControllerAdvice
public class GlobalExceptionHandler {

    // @audit-ok [Execução Timer (21) — Exception genérica retorna 500 com mensagem genérica, sem detalhes internos]
    @ExceptionHandler(Exception.class)
    public ResponseEntity<MessageResponseDTO> handleGenericException(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(MessageResponseDTO.builder().success(false).message("Erro interno no servidor.").build());
    }

    // @audit-ok [Recurso inexistente — RecursoNaoEncontradoException retorna 404 com a mensagem de negócio]
    @ExceptionHandler(RecursoNaoEncontradoException.class)
    public ResponseEntity<MessageResponseDTO> handleNotFound(RecursoNaoEncontradoException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(MessageResponseDTO.builder().success(false).message(ex.getMessage()).build());
    }

    // @audit-ok [Regra de negócio — RegraNegocioException retorna 422 (ex.: limite de hábitos, saldo, sessão duplicada)]
    @ExceptionHandler(RegraNegocioException.class)
    public ResponseEntity<MessageResponseDTO> handleRegraNegocio(RegraNegocioException ex) {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(MessageResponseDTO.builder().success(false).message(ex.getMessage()).build());
    }

    // @audit-ok [Criar Hábito (17) / Loja Escudo (13) — RuntimeException genérica retorna 400 com a mensagem de negócio]
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<MessageResponseDTO> handleRuntimeException(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(MessageResponseDTO.builder().success(false).message(ex.getMessage()).build());
    }

    // @audit-ok [Login (11) / Login (12) — IllegalArgumentException retorna 401 para credenciais inválidas]
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<MessageResponseDTO> handleIllegalArgumentException(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(MessageResponseDTO.builder().success(false).message(ex.getMessage()).build());
    }

    // @audit-ok [Criar Hábito (15) / Execução Timer (19) — MethodArgumentNotValidException retorna 400 para falhas de @Valid]
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<MessageResponseDTO> handleValidationException(MethodArgumentNotValidException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(MessageResponseDTO.builder().success(false).message("Dados inválidos na requisição.").build());
    }
}
