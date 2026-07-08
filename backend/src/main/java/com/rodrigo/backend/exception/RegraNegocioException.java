package com.rodrigo.backend.exception;

// @audit-ok [Exceção — violação de regra de negócio (422); ex.: limite de hábitos, saldo insuficiente, sessão duplicada]

public class RegraNegocioException extends RuntimeException {

    public RegraNegocioException(String mensagem) {
        super(mensagem);
    }
}
