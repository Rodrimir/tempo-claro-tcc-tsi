package com.rodrigo.backend2java.habito;

import java.util.List;
import java.util.UUID;
import java.util.Set;
import java.util.ArrayList;
import java.util.Optional;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZonedDateTime;
import org.springframework.stereotype.Service;
import com.rodrigo.backend2java.usuario.Usuario;
import com.rodrigo.backend2java.infra.util.ZonaUsuario;

// @audit-ok [E2.1 — ponto único de cálculo de status_habitos.proximo_vencimento.
// Usado por HabitoService (criação/edição), GamificacaoService (após
// conclusão) e FechamentoDiarioJob (virada de dia).
//
// O horário de referência vive em sub_atividades.sub_horario_inicio (não em
// habitos — essa coluna não existe no schema v2.1, ver HabitoRepository.java).
//
// E2.8 (item 4): até aqui, SEMPRE usava a 1ª sub_atividade (sub_ordem=1),
// porque até a E2.8 todas as ocorrências de um hábito compartilhavam o mesmo
// horário — não fazia diferença qual delas era lida. Agora que cada ocorrência
// pode ter seu próprio horário (E2.8, item 1), calcular() precisa saber
// QUANTAS já foram cumpridas hoje (execucoesHoje) pra apontar pra próxima
// pendente, não sempre pra primeira.]
@Service
public class ProximoVencimentoService {

    // Mesmo fallback do item 1 do prompt: horário nulo/ausente vira 23:59.
    private static final LocalTime HORARIO_PADRAO = LocalTime.of(23, 59);

    // Quanto tempo depois do fim marcado de uma ocorrência ela ainda pode ser
    // cumprida antes de virar FALHOU. Passado isso, a ocorrência não aparece
    // mais como "atrasada" indefinidamente — ela simplesmente falhou, e o foco
    // passa para a próxima. O que decide o dia (RF07/RF13) continua sendo o
    // total acumulado contra a meta, não esta marca por ocorrência.
    private static final int TOLERANCIA_FALHA_MINUTOS = 30;

    private final SubAtividadeRepository subAtividadeRepository;

    public ProximoVencimentoService(SubAtividadeRepository subAtividadeRepository) {
        this.subAtividadeRepository = subAtividadeRepository;
    }

    public enum StatusOcorrenciaHoje {
        FEITO, FALHOU, ATIVA, PENDENTE
    }

    public record OcorrenciaComStatus(SubAtividade subAtividade, StatusOcorrenciaHoje status) {
    }

    /**
     * O status de HOJE de cada ocorrência, na mesma ordem de sub_ordem.
     *
     * <p>FEITO vem do histórico real (por sub_atividade_id, não por contagem —
     * uma execução tardia pode cumprir uma ocorrência diferente da primeira
     * pendente, ver {@link #encontrarAtiva}). Sem execução, uma ocorrência é
     * FALHOU quando seu fim (ou início, se não houver fim) mais
     * {@value #TOLERANCIA_FALHA_MINUTOS} minutos já passou; a primeira que não
     * é nem FEITO nem FALHOU é a ATIVA (a única que a Home libera pra fazer);
     * as depois dela são PENDENTE.
     */
    public List<OcorrenciaComStatus> calcularStatusDeHoje(final List<SubAtividade> subAtividadesOrdenadas,
            final Set<UUID> feitasHojeIds, final ZonedDateTime agora) {
        final var resultado = new ArrayList<OcorrenciaComStatus>();
        var jaEncontrouAtiva = false;
        for (final var subAtividade : subAtividadesOrdenadas) {
            final StatusOcorrenciaHoje status;
            if (feitasHojeIds.contains(subAtividade.getId())) {
                status = StatusOcorrenciaHoje.FEITO;
            } else {
                final var horarioInicio = subAtividade.getHorarioInicio() != null
                        ? subAtividade.getHorarioInicio()
                        : HORARIO_PADRAO;
                final var fimEfetivo = subAtividade.getHorarioFim() != null
                        ? subAtividade.getHorarioFim()
                        : horarioInicio;
                final var prazoFinal = agora.toLocalDate().atTime(fimEfetivo)
                        .plusMinutes(TOLERANCIA_FALHA_MINUTOS).atZone(agora.getZone());
                if (agora.isAfter(prazoFinal)) {
                    status = StatusOcorrenciaHoje.FALHOU;
                } else if (!jaEncontrouAtiva) {
                    status = StatusOcorrenciaHoje.ATIVA;
                    jaEncontrouAtiva = true;
                } else {
                    status = StatusOcorrenciaHoje.PENDENTE;
                }
            }
            resultado.add(new OcorrenciaComStatus(subAtividade, status));
        }
        return resultado;
    }

    /** A ocorrência que a Home libera agora pra fazer — a primeira que não é FEITO nem FALHOU. */
    public Optional<SubAtividade> encontrarAtiva(final List<SubAtividade> subAtividadesOrdenadas,
            final Set<UUID> feitasHojeIds, final ZonedDateTime agora) {
        return calcularStatusDeHoje(subAtividadesOrdenadas, feitasHojeIds, agora).stream()
                .filter(o -> o.status() == StatusOcorrenciaHoje.ATIVA)
                .map(OcorrenciaComStatus::subAtividade)
                .findFirst();
    }

    /**
     * @param feitasHojeIds ids das sub_atividades já cumpridas hoje (histórico real,
     *        não contagem — ver {@link #calcularStatusDeHoje}). Vazio para um
     *        hábito recém-criado ou recém-editado (sub_atividades novas, sem
     *        histórico ainda vinculado a elas).
     */
    public OffsetDateTime calcular(final Habito habito, final Usuario usuario, final Set<UUID> feitasHojeIds) {
        final var subAtividades = subAtividadeRepository.findAllByHabitoIdOrderByOrdem(habito.getId());
        final var fuso = ZonaUsuario.resolver(usuario);
        final var agora = ZonedDateTime.now(fuso);

        final var ativa = encontrarAtiva(subAtividades, feitasHojeIds, agora);
        if (ativa.isPresent()) {
            final var horarioPendente = ativa.get().getHorarioInicio() != null
                    ? ativa.get().getHorarioInicio()
                    : HORARIO_PADRAO;
            // @audit-ok [Diferente do comportamento pré-E2.8: se o horário desta
            // ocorrência já passou hoje, o vencimento fica no passado de propósito
            // (não pula pro dia seguinte) — é assim que Home.jsx já identifica
            // atraso (getAvatarExpression, diffMin < -60). Antes da E2.8 isso só
            // acontecia pra hábitos de 1x/dia; agora vale igual pra qualquer
            // ocorrência pendente.]
            return agora.toLocalDate().atTime(horarioPendente).atZone(fuso).toOffsetDateTime();
        }

        // Todas as ocorrências de hoje já foram cumpridas ou falharam (ou o hábito
        // não tem nenhuma sub_atividade ainda) — vencimento vira a 1ª ocorrência do
        // próximo dia programado.
        final var horarioPrimeiraOcorrencia = subAtividades.isEmpty() || subAtividades.get(0).getHorarioInicio() == null
                ? HORARIO_PADRAO
                : subAtividades.get(0).getHorarioInicio();
        var proximoDia = agora.toLocalDate().atTime(horarioPrimeiraOcorrencia).atZone(fuso).plusDays(1);

        // @audit-ok [E2.4 (item 3) — pula dias não marcados em
        // hab_frequencia_semanal, avançando até o próximo dia programado. Sem
        // isso, um hábito de "só segunda e quarta" teria proximo_vencimento
        // apontando pra uma terça-feira comum, que passaria despercebida e o
        // frontend leria como atrasada num dia em que não havia nada programado.
        // Esta é a única chamadora de calcular() usada por HabitoService,
        // GamificacaoService e FechamentoDiarioJob — corrigir aqui corrige as
        // três, sem duplicar a regra em cada uma.]
        proximoDia = avancarAteDiaProgramado(proximoDia, habito.getFrequenciaSemanal());

        return proximoDia.toOffsetDateTime();
    }

    // @audit-ok [Convenção confirmada (item 1): posição 1 = domingo, posição 7
    // = sábado. dayOfWeek.getValue() vai de 1 (segunda) a 7 (domingo); "% 7"
    // transforma domingo em 0 e mantém segunda..sábado em 1..6 — mesmo índice
    // 0-based usado por StatsService (E2.2) e por Date.getDay() no frontend.]
    private ZonedDateTime avancarAteDiaProgramado(ZonedDateTime candidato, final String frequenciaSemanal) {
        if (frequenciaSemanal == null || frequenciaSemanal.length() != 7) {
            return candidato; // sem máscara válida: mantém o comportamento anterior a esta tarefa
        }
        // A convenção de índice (domingo = 0) mora em FrequenciaSemanal, e não
        // mais aqui: era a terceira cópia da mesma regra no projeto.
        for (var tentativas = 0; tentativas < 7; tentativas++) {
            if (FrequenciaSemanal.ehDiaProgramado(frequenciaSemanal, candidato.toLocalDate())) {
                return candidato;
            }
            candidato = candidato.plusDays(1);
        }
        // ck_hab_freq do schema já proíbe '0000000' — inalcançável na prática,
        // só evita loop infinito se a constraint mudar no futuro.
        return candidato;
    }
}
