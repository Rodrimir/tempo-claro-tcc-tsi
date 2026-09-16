package com.rodrigo.backend2java.verificacao;

// .name() bate exatamente com os valores aceitos por ck_cod_tipo — não é
// coincidência, é o contrato entre este enum e o CHECK do schema.
public enum TipoCodigo {
    VERIFICACAO_EMAIL,
    RECUPERACAO_SENHA
}
