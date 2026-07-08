package com.rodrigo.backend.service;

import java.time.ZoneId;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import com.rodrigo.backend.model.RegistroDiario;
import org.springframework.stereotype.Component;
import org.springframework.scheduling.annotation.Scheduled;
import com.rodrigo.backend.repository.HabitoRepository;
import com.rodrigo.backend.repository.UsuarioRepository;
import com.rodrigo.backend.repository.RegistroDiarioRepository;

// @audit-ok [Fechamento Diário — job de virada de dia: apura recompensa/escudo dos dias já encerrados no fuso de cada usuário.
//   Roda de hora em hora e é idempotente (a apuração não credita o mesmo dia duas vezes).]

@Component
@RequiredArgsConstructor
public class FechamentoDiarioJob {

    private final HabitoRepository habitoRepository;
    private final UsuarioRepository usuarioRepository;
    private final RegistroDiarioRepository registroDiarioRepository;
    private final ConclusaoDiaService conclusaoDiaService;

    // @audit-info [Fechamento Diário — fecha qualquer dia anterior a "hoje" (no fuso do usuário) ainda não apurado]
    @Scheduled(fixedRate = 3_600_000L)
    public void fecharDiasPassados() {
        for (final var habito : habitoRepository.findAllAtivos()) {
            final var usuarioOpt = usuarioRepository.findById(habito.getUsuarioId());
            if (usuarioOpt.isEmpty()) {
                continue;
            }
            final ZoneId zona = ZoneId.of(usuarioOpt.get().getFusoHorario());
            final LocalDate hoje = LocalDate.now(zona);

            registroDiarioRepository.findByHabitoIdAndDataFrom(habito.getId(), hoje.minusDays(7)).stream()
                    .map(RegistroDiario::getDataExecucao)
                    .filter(d -> d.isBefore(hoje))
                    .forEach(d -> conclusaoDiaService.apurarDiaPassado(habito, d, zona));
        }
    }
}