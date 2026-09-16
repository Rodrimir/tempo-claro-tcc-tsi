package com.rodrigo.backend2java.verificacao;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * PLANO_REESTRUTURACAO.md, B/C — implementação real, via Gmail SMTP.
 * {@code @Async} (habilitado por {@code @EnableAsync} em BackEndIiApplication):
 * quem chama {@link #enviarCodigo} não espera o SMTP responder.
 *
 * <p>{@code @Profile("!test")} deixa o perfil de teste livre para usar
 * FakeEmailService (src/test) em vez de bater num servidor SMTP de verdade.
 */
@Service
@Profile("!test")
public class SmtpEmailService implements EmailService {

    private final JavaMailSender mailSender;
    private final String remetente;

    public SmtpEmailService(JavaMailSender mailSender, @Value("${spring.mail.username:}") String remetente) {
        this.mailSender = mailSender;
        this.remetente = remetente;
    }

    @Override
    @Async
    public void enviarCodigo(final String destino, final String codigo, final TipoCodigo tipo, final String idioma) {
        final var mensagem = new SimpleMailMessage();
        mensagem.setFrom(remetente);
        mensagem.setTo(destino);
        mensagem.setSubject(assunto(tipo, idioma));
        mensagem.setText(corpo(tipo, idioma, codigo));
        mailSender.send(mensagem);
    }

    private String assunto(final TipoCodigo tipo, final String idioma) {
        final var ingles = "en-US".equals(idioma);
        if (tipo == TipoCodigo.VERIFICACAO_EMAIL) {
            return ingles ? "Tempo Claro — confirm your e-mail" : "Tempo Claro — confirme seu e-mail";
        }
        return ingles ? "Tempo Claro — password recovery" : "Tempo Claro — recuperação de senha";
    }

    private String corpo(final TipoCodigo tipo, final String idioma, final String codigo) {
        final var ingles = "en-US".equals(idioma);
        if (tipo == TipoCodigo.VERIFICACAO_EMAIL) {
            return ingles
                    ? "Your verification code is: " + codigo
                            + "\n\nIt expires in 15 minutes. If you didn't request this code, you can ignore this e-mail."
                    : "Seu código de verificação é: " + codigo
                            + "\n\nEle expira em 15 minutos. Se você não pediu este código, ignore este e-mail.";
        }
        return ingles
                ? "Your password recovery code is: " + codigo
                        + "\n\nIt expires in 15 minutes. If you didn't request this code, you can ignore this e-mail — your password stays the same."
                : "Seu código de recuperação de senha é: " + codigo
                        + "\n\nEle expira em 15 minutos. Se você não pediu este código, ignore este e-mail — sua senha continua a mesma.";
    }
}
