package com.rodrigo.backend.exception;

// @audit-ok [Exceção — recurso inexistente (404); lançada quando um id não corresponde a nenhum registro]

public class RecursoNaoEncontradoException extends RuntimeException {

    public RecursoNaoEncontradoException(String mensagem) {
        super(mensagem);
    }
}
