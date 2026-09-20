package com.rodrigo.backend2java.stats;

import java.util.UUID;
import java.util.Comparator;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import com.rodrigo.backend2java.habito.AcessoHabitoService;
import com.rodrigo.backend2java.habito.FrequenciaSemanal;
import com.rodrigo.backend2java.infra.util.ZonaUsuario;
import com.rodrigo.backend2java.execucao.HistoricoExecucaoRepository;

@Service
public class StatsService {

    private static final int DIAS_JANELA = 30;

    private static final int TOTAL_RECORDES = 3;

    private static final String[] NOMES_DIA_SEMANA = { "Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb" };

    private final AcessoHabitoService acessoHabitoService;
    private final HistoricoExecucaoRepository historicoExecucaoRepository;

    public StatsService(AcessoHabitoService acessoHabitoService, HistoricoExecucaoRepository historicoExecucaoRepository) {
        this.acessoHabitoService = acessoHabitoService;
        this.historicoExecucaoRepository = historicoExecucaoRepository;
    }

    public StatsResponseDTO obterEstatisticas(final UUID habitoId, final String emailContexto) {
        final var acesso = acessoHabitoService.carregar(habitoId, emailContexto);
        final var habito = acesso.habito();

        final var metaDoDia = Math.max(1, habito.getMetaBase() == null ? 1 : habito.getMetaBase());

        final var hoje = LocalDate.now(ZonaUsuario.resolver(acesso.dono()));
        final var inicio = hoje.minusDays(DIAS_JANELA - 1L);

        final var agregadosPorData = historicoExecucaoRepository.agregarPorDia(habitoId, inicio, hoje).stream()
                .collect(Collectors.toMap(HistoricoExecucaoRepository.AgregadoDiario::getData, agregado -> agregado));

        final var parciaisPorData = historicoExecucaoRepository
                .agregarDesistenciasPorDia(habitoId, inicio, hoje).stream()
                .collect(Collectors.toMap(HistoricoExecucaoRepository.AgregadoDiario::getData, agregado -> agregado));

        final var dias = new ArrayList<DiaStatsDTO>(DIAS_JANELA);
        var diasComMetaCumprida = 0;
        var diasProgramados = 0;

        for (var i = 0; i < DIAS_JANELA; i++) {
            final var data = inicio.plusDays(i);
            final var agregado = agregadosPorData.get(data);
            final var parcial = parciaisPorData.get(data);
            final var temCompleto = agregado != null;

            final var valor = temCompleto
                    ? valorDe(agregado)
                    : (parcial != null ? valorDe(parcial) : 0);
            final var execucoes = temCompleto ? agregado.getExecucoes() : 0;

            final var metaCumprida = temCompleto && valor >= metaDoDia;

            final var diaProgramado = FrequenciaSemanal.ehDiaProgramado(habito.getFrequenciaSemanal(), data);
            if (diaProgramado) {
                diasProgramados++;
            }

            if (metaCumprida) {
                diasComMetaCumprida++;
            }

            dias.add(DiaStatsDTO.builder()
                    .data(data)
                    .nome(NOMES_DIA_SEMANA[data.getDayOfWeek().getValue() % 7])
                    .valor_realizado(valor)
                    .execucoes(execucoes)
                    .meta_cumprida(metaCumprida)
                    .parcial(!temCompleto && parcial != null)
                    .dia_programado(diaProgramado)
                    .build());
        }

        final var recordes = dias.stream()
                .filter(dia -> dia.valor_realizado() > 0 && !Boolean.TRUE.equals(dia.parcial()))
                .sorted(Comparator.comparing(DiaStatsDTO::valor_realizado).reversed()
                        .thenComparing(DiaStatsDTO::data, Comparator.reverseOrder()))
                .limit(TOTAL_RECORDES)
                .map(dia -> StatsResponseDTO.RecordeDTO.builder()
                        .data(dia.data())
                        .valor(dia.valor_realizado())
                        .build())
                .toList();

        final var base = Math.max(1, diasProgramados);
        final var constanciaPercentual = Math.round((diasComMetaCumprida * 100f) / base);

        return StatsResponseDTO.builder()
                .dias(dias)
                .recordes(recordes)
                .dias_com_meta_cumprida(diasComMetaCumprida)
                .constancia_percentual(constanciaPercentual)
                .dias_periodo(DIAS_JANELA)
                .dias_cobrados(diasProgramados)
                .build();
    }

    private int valorDe(final HistoricoExecucaoRepository.AgregadoDiario agregado) {
        return agregado.getSomaValor() == null ? 0 : agregado.getSomaValor();
    }
}
