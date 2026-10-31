package com.rodrigo.backend2java.regras;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;

// Relógio ajustável para os testes das regras que dependem da hora do dia. Fixa a hora de hoje
// num fuso, sem mudar a data: o resto do servidor continua lendo a data real.
public class RelogioDeTeste extends Clock {

    private volatile Instant agora = Instant.now();

    public void fixarHoje(final ZoneId fuso, final LocalTime hora) {
        agora = LocalDate.now(fuso).atTime(hora).atZone(fuso).toInstant();
    }

    public void voltarAoRelogioReal() {
        agora = Instant.now();
    }

    @Override
    public ZoneId getZone() {
        return ZoneId.of("UTC");
    }

    @Override
    public Clock withZone(final ZoneId zone) {
        final var base = this;
        return new Clock() {
            @Override
            public ZoneId getZone() {
                return zone;
            }

            @Override
            public Clock withZone(final ZoneId outra) {
                return base.withZone(outra);
            }

            @Override
            public Instant instant() {
                return base.instant();
            }
        };
    }

    @Override
    public Instant instant() {
        return agora;
    }

    @TestConfiguration
    public static class Config {

        @Bean
        @Primary
        public RelogioDeTeste relogioDeTeste() {
            return new RelogioDeTeste();
        }
    }
}
