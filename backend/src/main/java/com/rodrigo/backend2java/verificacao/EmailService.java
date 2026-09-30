package com.rodrigo.backend2java.verificacao;

public interface EmailService {

    void enviarCodigo(String destino, String codigo, TipoCodigo tipo, String idioma);
}
