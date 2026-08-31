package com.rodrigo.backend2java.service;

import java.util.UUID;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.rodrigo.backend2java.repository.HabitoRepository;
import com.rodrigo.backend2java.repository.UsuarioRepository;
import com.rodrigo.backend2java.repository.SubAtividadeRepository;
import com.rodrigo.backend2java.repository.HistoricoExecucaoRepository;
import com.rodrigo.backend2java.model.dto.response.DiaStatsDTO;
import com.rodrigo.backend2java.model.dto.response.StatsResponseDTO;

// @audit-ok [E2.2 (item 1) — StatsController deixa de calcular sozinho (era
// só "return new ArrayList<>()" direto no controller) e passa a delegar
// aqui. GET /api/stats/weekly ganhou o query param obrigatório habitoId, que
// antes não existia de forma nenhuma — o endpoint não tinha como saber de
// qual hábito os dados eram.]
@Service
@RequiredArgsConstructor
public class StatsService {

    private static final int DIAS_JANELA = 7;

    // Mesma abreviação já usada em CreateHabit/index.jsx (DIAS_SEMANA), pra não
    // ter dois vocabulários de dia da semana diferentes no mesmo app.
    // DayOfWeek.getValue(): 1=segunda...7=domingo; este array começa em domingo.
    private static final String[] NOMES_DIA_SEMANA = { "Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb" };

    private final HabitoRepository habitoRepository;
    private final UsuarioRepository usuarioRepository;
    private final SubAtividadeRepository subAtividadeRepository;
    private final HistoricoExecucaoRepository historicoExecucaoRepository;

    public StatsResponseDTO obterEstatisticasSemanais(final UUID habitoId, final String emailContexto) {
        final var habito = habitoRepository.findById(habitoId)
                .orElseThrow(() -> new RuntimeException("Hábito não encontrado"));

        // @audit-ok [E2.2 — achado além do prompt, mas necessário: sem isso
        // qualquer usuário autenticado poderia ver as estatísticas de um
        // hábito de outra pessoa só sabendo (ou adivinhando) o UUID, já que
        // habitoId agora chega cru por query param, sem passar pelo
        // SecurityContext como os outros endpoints de hábito fazem.]
        final var usuario = usuarioRepository.findByEmail(emailContexto)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        if (!habito.getUsuarioId().equals(usuario.getId())) {
            throw new RuntimeException("Hábito não pertence ao usuário autenticado");
        }

        // @audit-ok [Mesma derivação de vw_habito_hoje: a meta de frequência
        // diária é a CONTAGEM de sub_atividades, não uma coluna (ver E0.5.5/E1.1).
        // Aplicado uniformemente aos 7 dias — sub_atividades não tem histórico
        // próprio, então usa a configuração atual do hábito para todo o período.]
        final var metaFrequenciaDiaria = Math.max(1, subAtividadeRepository.findAllByHabitoId(habitoId).size());

        final var hoje = LocalDate.now();
        final var inicio = hoje.minusDays(DIAS_JANELA - 1L);

        final var agregadosPorData = historicoExecucaoRepository.agregarPorDia(habitoId, inicio, hoje).stream()
                .collect(Collectors.toMap(HistoricoExecucaoRepository.AgregadoDiario::data, agregado -> agregado));

        // @audit-ok [E2.5 (item 2) — RF10: dias sem NENHUMA execução completa,
        // mas com desistência/escudo, ainda geram uma barra parcial no gráfico
        // em vez de sumir. Só é consultada aqui embaixo quando faltar um
        // agregado completo pro dia (ver o loop) — um dia com pelo menos uma
        // conclusão sempre mostra a conclusão, nunca a desistência do mesmo dia.]
        final var desistenciasPorData = historicoExecucaoRepository.agregarDesistenciasPorDia(habitoId, inicio, hoje)
                .stream()
                .collect(Collectors.toMap(HistoricoExecucaoRepository.AgregadoDiario::data, agregado -> agregado));

        // @audit-ok [E2.2 (item 3) — os 7 dias SEMPRE aparecem, na ordem do mais
        // antigo pro mais recente; dia sem execução vira zero aqui, não some.]
        final var dias = new ArrayList<DiaStatsDTO>(DIAS_JANELA);
        var recorde = 0;
        var diasComMetaCumprida = 0;

        for (var i = 0; i < DIAS_JANELA; i++) {
            final var data = inicio.plusDays(i);
            final var agregado = agregadosPorData.get(data);
            final var desistencia = desistenciasPorData.get(data);
            final var temCompleto = agregado != null;

            // @audit-ok [E2.5 — um dia com pelo menos uma execução completa
            // mostra o valor completo (mesma regra de antes), mesmo que também
            // tenha uma desistência no mesmo dia (ex.: desistiu na 1ª tentativa,
            // completou na 2ª). Só vira "parcial" quando NÃO há execução
            // completa nenhuma nesse dia.]
            final var valor = temCompleto ? agregado.somaValor() : (desistencia != null ? desistencia.somaValor() : 0);
            // @audit-ok [execucoes conta só conclusões de verdade, nunca
            // desistências — é o número usado por meta_cumprida logo abaixo, e
            // uma desistência nunca deve contar como meta cumprida (RF10 é sobre
            // preservar o dado, não sobre premiar quem não terminou).]
            final var execucoes = temCompleto ? agregado.execucoes() : 0;
            final var parcial = !temCompleto && desistencia != null;
            // @audit-ok [E2.2 (item 4) — "meta cumprida" no dia usa a mesma regra
            // de status_hoje = COMPLETED em vw_habito_hoje: execuções no dia
            // atingirem a meta de frequência diária. Consistente com o que o
            // Dashboard já considera "hábito completo hoje".]
            final var metaCumprida = execucoes >= metaFrequenciaDiaria;

            // @audit-ok [E2.5 — recorde só considera valor de dia com execução
            // completa; um valor parcial de desistência não vira "recorde da
            // semana" (seria estranho premiar uma tentativa que não terminou).]
            if (temCompleto && valor > recorde) {
                recorde = valor;
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
                    .parcial(parcial)
                    .build());
        }

        // @audit-ok [E2.2 (item 4/6) — RF17: constância semanal, que antes não
        // existia nem no backend nem na interface.]
        final var constanciaPercentual = Math.round((diasComMetaCumprida * 100f) / DIAS_JANELA);

        return StatsResponseDTO.builder()
                .dias(dias)
                .recorde(recorde)
                .dias_com_meta_cumprida(diasComMetaCumprida)
                .constancia_semanal_percentual(constanciaPercentual)
                .build();
    }
}
