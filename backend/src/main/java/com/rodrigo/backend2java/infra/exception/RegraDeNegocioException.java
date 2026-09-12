package com.rodrigo.backend2java.infra.exception;

/**
 * A requisição está bem formada, mas viola uma regra de negócio: limite de dois
 * hábitos ativos (RF03), saldo insuficiente para o escudo (RF15), escudo já usado
 * hoje, execução duplicada (RF21).
 *
 * <p>Vira HTTP 422, conforme a convenção da §5.1 da monografia — que distingue
 * explicitamente "erro de validação" (400) de "violação de regra de negócio" (422).
 */
public class RegraDeNegocioException extends RuntimeException {

    public RegraDeNegocioException(final String mensagem) {
        super(mensagem);
    }
}
