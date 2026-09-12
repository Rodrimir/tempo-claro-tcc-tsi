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

/**
 * Acompanhamento de desempenho (RF17, F16–F20).
 *
 * <p>v3.0, três mudanças:
 * <ul>
 *   <li><b>Janela mensal.</b> Eram 7 dias; passaram a ser 30.</li>
 *   <li><b>Fuso do usuário.</b> A janela era montada com {@code LocalDate.now()}, o
 *       relógio da JVM — que é UTC no Render. Depois das 21h no Brasil, "hoje" já
 *       era amanhã e o gráfico inteiro deslocava um dia em relação a
 *       {@code his_data_local}, que sempre foi gravada no fuso do dono (RNF13).</li>
 *   <li><b>Meta pelo total.</b> "Meta cumprida" era contagem de execuções contra o
 *       número de ocorrências; RF07/RF13 avaliam o dia pelo total realizado, então
 *       bater a meta em duas das três ocorrências agora conta.</li>
 * </ul>
 */
@Service
public class StatsService {

    /** RF17 (revisto): o acompanhamento passou a ser do mês, não da semana. */
    private static final int DIAS_JANELA = 30;

    /** F18: os três maiores dias do período, não só o maior. */
    private static final int TOTAL_RECORDES = 3;

    // DayOfWeek.getValue(): 1=segunda...7=domingo; este array começa em domingo,
    // mesma convenção da máscara hab_frequencia_semanal e do seletor do app.
    private static final String[] NOMES_DIA_SEMANA = { "Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb" };

    private final AcessoHabitoService acessoHabitoService;
    private final HistoricoExecucaoRepository historicoExecucaoRepository;

    public StatsService(AcessoHabitoService acessoHabitoService, HistoricoExecucaoRepository historicoExecucaoRepository) {
        this.acessoHabitoService = acessoHabitoService;
        this.historicoExecucaoRepository = historicoExecucaoRepository;
    }

    public StatsResponseDTO obterEstatisticas(final UUID habitoId, final String emailContexto) {
        // A checagem de propriedade que só existia aqui virou AcessoHabitoService e
        // hoje vale para todos os endpoints por hábito (RF22/RNF08).
        final var acesso = acessoHabitoService.carregar(habitoId, emailContexto);
        final var habito = acesso.habito();

        // A meta atual é aplicada a todo o período: nem hab_meta_base nem
        // sub_atividades têm histórico próprio, então um mês em que a progressão
        // automática subiu a meta é lido com a meta de hoje. Compromisso conhecido.
        final var metaDoDia = Math.max(1, habito.getMetaBase() == null ? 1 : habito.getMetaBase());

        final var hoje = LocalDate.now(ZonaUsuario.resolver(acesso.dono()));
        final var inicio = hoje.minusDays(DIAS_JANELA - 1L);

        final var agregadosPorData = historicoExecucaoRepository.agregarPorDia(habitoId, inicio, hoje).stream()
                .collect(Collectors.toMap(HistoricoExecucaoRepository.AgregadoDiario::getData, agregado -> agregado));

        // @audit-ok [E2.5 (item 2) — RF10: dias sem NENHUMA execução completa, mas
        // com desistência, escudo manual ou escudo automático, ainda geram uma barra
        // parcial no gráfico em vez de sumir.]
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

            // Um dia com pelo menos uma conclusão mostra o valor concluído, mesmo que
            // também tenha uma desistência (desistiu na 1ª tentativa, completou na 2ª).
            final var valor = temCompleto
                    ? valorDe(agregado)
                    : (parcial != null ? valorDe(parcial) : 0);
            final var execucoes = temCompleto ? agregado.getExecucoes() : 0;

            // RF07/RF13: o dia se fecha pelo total realizado na janela 00:00-23:59,
            // não pela contagem de ocorrências. É a mesma regra que FechamentoService
            // usa para creditar e mover a ofensiva — as duas leituras do mesmo fato
            // precisam concordar.
            final var metaCumprida = temCompleto && valor >= metaDoDia;

            // Dia fora da máscara semanal não é dia de falha: o fechamento nem
            // avalia a meta nele. Contá-lo no denominador da constância fazia um
            // hábito de segunda a sexta travar em ~71% mesmo sem falhar um dia
            // sequer — as duas telas diziam coisas opostas sobre a mesma semana.
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

        // F18 — "o maior valor realizado em um único dia", agora os três maiores.
        // Sem exigir meta cumprida: um dia de 90% da meta é um recorde legítimo se
        // for o maior do mês. Dias parciais (desistência) ficam de fora — o valor
        // existe, mas não houve conclusão nenhuma para chamar de desempenho.
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

        // F19 — constância: percentual dos dias COBRADOS em que a meta foi cumprida.
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
