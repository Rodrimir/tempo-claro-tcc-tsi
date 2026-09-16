package com.rodrigo.backend2java.verificacao;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

/**
 * PLANO_REESTRUTURACAO.md, T.2 — substitui SmtpEmailService no perfil de
 * teste: guarda o último código por (email, tipo) em memória, sem SMTP
 * nenhum. Roda síncrono (sem @Async) de propósito — quando POST
 * /auth/register devolve, o código já está aqui para o teste ler.
 */
@Service
@Profile("test")
public class FakeEmailService implements EmailService {

    private final Map<String, String> ultimoCodigoPorChave = new ConcurrentHashMap<>();

    @Override
    public void enviarCodigo(final String destino, final String codigo, final TipoCodigo tipo, final String idioma) {
        ultimoCodigoPorChave.put(chave(destino, tipo), codigo);
    }

    public String ultimoCodigo(final String destino, final TipoCodigo tipo) {
        return ultimoCodigoPorChave.get(chave(destino, tipo));
    }

    private String chave(final String destino, final TipoCodigo tipo) {
        return destino + "|" + tipo.name();
    }
}
