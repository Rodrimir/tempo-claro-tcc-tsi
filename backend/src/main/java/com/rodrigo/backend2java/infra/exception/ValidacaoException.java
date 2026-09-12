package com.rodrigo.backend2java.infra.exception;

/**
 * Entrada malformada que a Bean Validation não tinha como pegar sozinha: fuso
 * horário inexistente, tema fora da lista, tipo de execução desconhecido,
 * horário ausente numa ocorrência.
 *
 * <p>Vira HTTP 400, conforme a convenção da §5.1 da monografia.
 */
public class ValidacaoException extends RuntimeException {

    public ValidacaoException(final String mensagem) {
        super(mensagem);
    }
}
