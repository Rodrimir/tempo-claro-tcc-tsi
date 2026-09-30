package com.rodrigo.backend2java.infra.exception;

public class RecursoNaoEncontradoException extends RuntimeException {

    public RecursoNaoEncontradoException(final String mensagem) {
        super(mensagem);
    }
}
