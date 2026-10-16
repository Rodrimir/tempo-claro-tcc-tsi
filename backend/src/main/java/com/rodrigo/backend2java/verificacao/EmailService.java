package com.rodrigo.backend2java.verificacao;

import com.rodrigo.backend2java.verificacao.model.TipoCodigo;

public interface EmailService {

    void enviarCodigo(String destino, String codigo, TipoCodigo tipo, String idioma);
}
