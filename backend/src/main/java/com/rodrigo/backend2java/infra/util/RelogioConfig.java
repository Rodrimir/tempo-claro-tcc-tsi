package com.rodrigo.backend2java.infra.util;

import java.time.Clock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

// Relógio das regras que dependem da hora do dia (dia retroativo e liberação da tarefa). Os
// testes dessas regras trocam este bean por um relógio fixo.
@Configuration
public class RelogioConfig {

    @Bean
    public Clock relogio() {
        return Clock.systemUTC();
    }
}
