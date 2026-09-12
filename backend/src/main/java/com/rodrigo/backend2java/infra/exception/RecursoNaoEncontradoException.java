package com.rodrigo.backend2java.infra.exception;

/**
 * O recurso pedido não existe — ou não pertence ao usuário autenticado.
 * Vira HTTP 404, conforme a convenção da §5.1 da monografia.
 *
 * <p>Usar esta exceção também para hábito de outro dono é deliberado: responder
 * 404 em vez de 403 não confirma a existência do UUID para quem está sondando.
 */
public class RecursoNaoEncontradoException extends RuntimeException {

    public RecursoNaoEncontradoException(final String mensagem) {
        super(mensagem);
    }
}
