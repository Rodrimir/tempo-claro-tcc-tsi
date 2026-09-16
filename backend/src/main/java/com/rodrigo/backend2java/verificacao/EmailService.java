package com.rodrigo.backend2java.verificacao;

/**
 * PLANO_REESTRUTURACAO.md, T.2 — interface pra existir uma FakeEmailService
 * nos testes (guarda em memória, sem SMTP nenhum) sem duplicar a lógica de
 * qual texto mandar pra qual tipo/idioma — essa lógica mora em
 * SmtpEmailService, a única implementação real.
 */
public interface EmailService {

    void enviarCodigo(String destino, String codigo, TipoCodigo tipo, String idioma);
}
