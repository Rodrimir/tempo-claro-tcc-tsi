package com.rodrigo.backend2java.execucao;

import java.util.UUID;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.rodrigo.backend2java.habito.Habito;
import com.rodrigo.backend2java.habito.FrequenciaSemanal;

@Service
public class FechamentoService {

    private static final Logger log = LoggerFactory.getLogger(FechamentoService.class);

    private static final int DIAS_POR_NIVEL = 10;

    private final StatusHabitoRepository statusHabitoRepository;
    private final HistoricoExecucaoRepository historicoRepository;

    public FechamentoService(StatusHabitoRepository statusHabitoRepository, HistoricoExecucaoRepository historicoRepository) {
        this.statusHabitoRepository = statusHabitoRepository;
        this.historicoRepository = historicoRepository;
    }

    public record ResultadoFechamento(LocalDate dia, boolean diaProgramado, boolean metaCumprida,
            int totalRealizado, int moedasCreditadas, int diasSeguidos, boolean escudoConsumido) {
    }

    @Transactional
    public ResultadoFechamento fecharDia(final Habito habito, final StatusHabito status, final LocalDate dia) {
        if (!FrequenciaSemanal.ehDiaProgramado(habito.getFrequenciaSemanal(), dia)) {
            limparContadoresDoDia(status, dia);
            statusHabitoRepository.save(status);
            return new ResultadoFechamento(dia, false, false, 0, 0, status.getDiasSeguidos(), false);
        }

        final var totalRealizado = totalRealizadoNoDia(habito.getId(), dia);
        final var metaDoDia = metaDoDia(habito);
        final var percentualDoDia = (double) totalRealizado / metaDoDia;

        final var metaCumprida = totalRealizado >= metaDoDia;

        var escudoConsumido = false;
        if (metaCumprida) {
            status.setDiasSeguidos(status.getDiasSeguidos() + 1);
            if (status.getDiasSeguidos() % DIAS_POR_NIVEL == 0) {
                status.setNivelAvatar(status.getNivelAvatar() + 1);
            }
        } else if (Boolean.TRUE.equals(status.getBloqueioUsadoHoje())) {
            escudoConsumido = true;
        } else if (status.getBloqueiosAcumulados() > 0) {
            status.setBloqueiosAcumulados(status.getBloqueiosAcumulados() - 1);
            registrarEscudoAutomatico(habito.getId(), dia, totalRealizado);
            escudoConsumido = true;
        } else {
            status.setDiasSeguidos(0);
        }

        final var moedasCreditadasHoje = status.getMoedasCreditadasHoje();
        limparContadoresDoDia(status, dia);
        statusHabitoRepository.save(status);

        log.info("Fechamento do hábito {} em {}: {}/{} ({}%), {} moeda(s), ofensiva {}{}.",
                habito.getId(), dia, totalRealizado, metaDoDia, Math.round(percentualDoDia * 100),
                moedasCreditadasHoje, status.getDiasSeguidos(), escudoConsumido ? " (escudo)" : "");

        return new ResultadoFechamento(dia, true, metaCumprida, totalRealizado, moedasCreditadasHoje,
                status.getDiasSeguidos(), escudoConsumido);
    }

    private int totalRealizadoNoDia(final UUID habitoId, final LocalDate dia) {
        return historicoRepository.agregarPorDia(habitoId, dia, dia).stream()
                .mapToInt(agregado -> agregado.getSomaValor() == null ? 0 : agregado.getSomaValor())
                .sum();
    }

    private int metaDoDia(final Habito habito) {
        return Math.max(1, habito.getMetaBase() == null ? 1 : habito.getMetaBase());
    }

    private void registrarEscudoAutomatico(final UUID habitoId, final LocalDate dia, final int totalRealizado) {
        historicoRepository.save(HistoricoExecucao.builder()
                .id(UUID.randomUUID())
                .habitoId(habitoId)
                .executionToken(UUID.randomUUID())
                .dataHoraExecucao(OffsetDateTime.now())
                .dataLocal(dia)
                .valorRealizado(totalRealizado)
                .moedasGanhas(0)
                .tipoSucesso("PROTEGIDO_AUTOMATICO")
                .build());
    }

    private void limparContadoresDoDia(final StatusHabito status, final LocalDate dia) {
        status.setExecucoesHoje(0);
        status.setValorAcumuladoHoje(0);
        status.setMoedasCreditadasHoje(0);
        status.setBloqueioUsadoHoje(false);
        status.setUltimoReset(dia);
    }
}
