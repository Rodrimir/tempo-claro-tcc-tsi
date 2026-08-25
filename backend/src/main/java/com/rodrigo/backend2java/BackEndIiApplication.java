package com.rodrigo.backend2java;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

// @EnableScheduling habilita o FechamentoDiarioJob, responsável pela virada de dia.
@EnableScheduling
@SpringBootApplication
public class BackEndIiApplication {
    public static void main(String[] args) {
        SpringApplication.run(BackEndIiApplication.class, args);
    }
}
