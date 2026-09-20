package com.rodrigo.backend2java.infra.exception;

public class ValidacaoException extends RuntimeException {

    public ValidacaoException(final String mensagem) {
        super(mensagem);
    }
}
