package com.rodrigo.backend2java;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

// @EnableScheduling habilita o FechamentoDiarioJob, responsável pela virada de dia.
// @EnableAsync habilita SmtpEmailService (PLANO_REESTRUTURACAO.md, B/C) — o
// envio roda em outra thread pra POST /auth/register e /forgot-password não
// ficarem presos esperando o SMTP responder.
@EnableScheduling
@EnableAsync
@SpringBootApplication
public class BackEndIiApplication {
    public static void main(String[] args) {
        SpringApplication.run(BackEndIiApplication.class, args);
    }
}
