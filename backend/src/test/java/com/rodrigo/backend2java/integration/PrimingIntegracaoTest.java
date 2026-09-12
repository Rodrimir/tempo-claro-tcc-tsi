package com.rodrigo.backend2java.integration;

import java.time.LocalTime;

import org.junit.jupiter.api.Test;

import com.rodrigo.backend2java.BaseAPIIntegracaoTest;
import com.rodrigo.backend2java.habito.HabitoRequestDTO;
import com.rodrigo.backend2java.habito.HabitoResponseDTO;
import com.rodrigo.backend2java.execucao.PrimingResponseDTO;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PrimingIntegracaoTest extends BaseAPIIntegracaoTest {

    @Test
    void priming_devolveTextoDaBibliotecaParaACategoriaDoHabito() {
        final var request = HabitoRequestDTO.builder()
                .titulo("Beber água")
                .categoria("AGUA")
                .meta_base(2000)
                .tipo_medida("QUANTIDADE")
                .modalidade("DIARIA")
                .meta_frequencia_diaria(1)
                .horario_agendado(LocalTime.of(8, 0))
                .build();
        final var habito = post("/api/habits", request, HabitoResponseDTO.class).getBody();

        final var priming = get("/api/habits/" + habito.id() + "/priming", PrimingResponseDTO.class);

        assertEquals("Seu corpo agradece cada gole. Vamos começar?", priming.getBody().texto());
    }
}
