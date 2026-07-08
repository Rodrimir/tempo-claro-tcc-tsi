package com.rodrigo.backend;

import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.SpringApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

// @audit-ok [Bootstrap — ponto de entrada da aplicação Spring Boot; @EnableScheduling ativa o job de fechamento diário (F04/§6.1)]

@SpringBootApplication
@EnableScheduling
public class BackEndIiApplication {
    public static void main(String[] args) {
        SpringApplication.run(BackEndIiApplication.class, args);
    }
}
