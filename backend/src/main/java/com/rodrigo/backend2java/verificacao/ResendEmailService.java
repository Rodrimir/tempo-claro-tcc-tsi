package com.rodrigo.backend2java.verificacao;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import com.rodrigo.backend2java.infra.exception.RegraDeNegocioException;
import com.rodrigo.backend2java.verificacao.model.TipoCodigo;

// @note - 11.1 (Cadastro) ResendEmailService: substitui o antigo envio por SMTP
// (JavaMailSender/SimpleMailMessage). Motivo: o plano gratuito do Render bloqueia saída nas
// portas SMTP 25/465/587 desde 26/09/2025 — SMTP funciona local, mas nunca entrega em produção.
// A API do Resend é HTTP/HTTPS puro (porta 443), que o Render não bloqueia. Isso também permite
// remover o código de verificação fixo de application-prod.properties (app.verificacao.codigo-fixo),
// que era um contorno provisório e um risco de segurança (RECUPERACAO_SENHA com código fixo
// permite tomar qualquer conta só sabendo o e-mail).
@Service
@Profile("!test")
public class ResendEmailService implements EmailService {

    private final RestClient restClient;
    private final String remetente;

    public ResendEmailService(final RestClient.Builder restClientBuilder,
            @Value("${app.resend.api-key}") final String apiKey,
            @Value("${app.resend.from}") final String remetente) {
        this.restClient = restClientBuilder
                .baseUrl("https://api.resend.com")
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .build();
        this.remetente = remetente;
    }

    // @audit-issue - 11.1 (Cadastro) [outcome: fixed] antes era @Async sem tratamento de erro
    // próprio: uma resposta de erro do Resend (chave inválida, domínio não verificado, limite
    // diário estourado) virava uma exceção não tratada numa thread separada — o Spring logava no
    // servidor, mas o cadastro já tinha respondido 201 e o usuário nunca ficava sabendo que o
    // e-mail não saiu. Corrigido tornando o envio síncrono: agora uma falha do Resend propaga
    // como RegraDeNegocioException (HTTP 422, GlobalExceptionHandler.java item 13.2) para quem
    // chamou. Em AuthService.cadastrar (item 7.1d, @Transactional) isso desfaz o save do usuário
    // e do código também — cadastro só "existe" se o e-mail realmente saiu. Efeito colateral
    // aceito: a resposta HTTP do cadastro agora espera a chamada de rede ao Resend terminar.
    @Override
    public void enviarCodigo(final String destino, final String codigo, final TipoCodigo tipo, final String idioma) {
        try {
            restClient.post()
                    .uri("/emails")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new EnvioResend(remetente, List.of(destino), assunto(tipo, idioma), corpo(tipo, idioma, codigo)))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException falhaNoEnvio) {
            throw new RegraDeNegocioException(
                    "Não foi possível enviar o e-mail de verificação agora. Tente novamente em instantes.");
        }
    }

    private record EnvioResend(String from, List<String> to, String subject, String text) {
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
