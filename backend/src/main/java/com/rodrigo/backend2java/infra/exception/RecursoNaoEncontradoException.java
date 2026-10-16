package com.rodrigo.backend2java.infra.exception;

import com.rodrigo.backend2java.infra.i18n.MensagemTraduzivel;
import com.rodrigo.backend2java.infra.i18n.Mensagens;

// Recebe a chave de resources/i18n/mensagens*.properties. O getMessage() fica em português; o
// GlobalExceptionHandler traduz para o idioma da requisição.
public class RecursoNaoEncontradoException extends RuntimeException implements MensagemTraduzivel {

    private final String chave;
    private final transient Object[] args;

    public RecursoNaoEncontradoException(final String chave, final Object... args) {
        super(Mensagens.em(Mensagens.PT, chave, args));
        this.chave = chave;
        this.args = args;
    }

    @Override
    public String getChave() {
        return chave;
    }

    @Override
    public Object[] getArgs() {
        return args;
    }
}
