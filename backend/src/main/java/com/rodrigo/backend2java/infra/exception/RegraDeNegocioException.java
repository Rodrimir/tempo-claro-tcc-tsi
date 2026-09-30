package com.rodrigo.backend2java.infra.exception;

public class RegraDeNegocioException extends RuntimeException {

    public RegraDeNegocioException(final String mensagem) {
        super(mensagem);
    }
}
