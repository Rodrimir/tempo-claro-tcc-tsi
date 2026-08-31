package com.rodrigo.backend2java.service;

import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZonedDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.rodrigo.backend2java.model.Habito;
import com.rodrigo.backend2java.model.Usuario;
import com.rodrigo.backend2java.util.ZonaUsuario;
import com.rodrigo.backend2java.repository.SubAtividadeRepository;

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
@RequiredArgsConstructor
public class ProximoVencimentoService {

    // Mesmo fallback do item 1 do prompt: horário nulo/ausente vira 23:59.
    private static final LocalTime HORARIO_PADRAO = LocalTime.of(23, 59);

    private final SubAtividadeRepository subAtividadeRepository;

    // @audit-ok [E2.8 (item 4) — ganhou o parâmetro execucoesHoje: antes desta
    // tarefa, sempre usava o horário da 1ª sub_atividade, não importa quantas
    // ocorrências do dia já tivessem sido cumpridas — um hábito de 3x/dia,
    // depois de cumprir 2, continuava mostrando o horário da ocorrência 1 (já
    // passado, "vencido" mesmo sem realmente estar). Agora aponta pra
    // ocorrência PENDENTE (índice = execucoesHoje na lista ordenada por
    // sub_ordem) — só cai no comportamento antigo (próximo dia programado, 1ª
    // ocorrência) quando todas as de hoje já foram cumpridas.]
    public OffsetDateTime calcular(final Habito habito, final Usuario usuario, final int execucoesHoje) {
        final var subAtividades = subAtividadeRepository.findAllByHabitoId(habito.getId());
        final var fuso = ZonaUsuario.resolver(usuario);
        final var agora = ZonedDateTime.now(fuso);

        final var haOcorrenciaPendenteHoje = !subAtividades.isEmpty() && execucoesHoje < subAtividades.size();
        if (haOcorrenciaPendenteHoje) {
            final var ocorrenciaPendente = subAtividades.get(execucoesHoje);
            final var horarioPendente = ocorrenciaPendente.getHorarioInicio() != null
                    ? ocorrenciaPendente.getHorarioInicio()
                    : HORARIO_PADRAO;
            // @audit-ok [Diferente do comportamento pré-E2.8: se o horário desta
            // ocorrência já passou hoje, o vencimento fica no passado de propósito
            // (não pula pro dia seguinte) — é assim que Home.jsx já identifica
            // atraso (getAvatarExpression, diffMin < -60). Antes da E2.8 isso só
            // acontecia pra hábitos de 1x/dia; agora vale igual pra qualquer
            // ocorrência pendente.]
            return agora.toLocalDate().atTime(horarioPendente).atZone(fuso).toOffsetDateTime();
        }

        // Todas as ocorrências de hoje já foram cumpridas (ou o hábito não tem
        // nenhuma sub_atividade ainda) — vencimento vira a 1ª ocorrência do
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
        for (var tentativas = 0; tentativas < 7; tentativas++) {
            final var posicao = candidato.getDayOfWeek().getValue() % 7;
            if (frequenciaSemanal.charAt(posicao) == '1') {
                return candidato;
            }
            candidato = candidato.plusDays(1);
        }
        // ck_hab_freq do schema já proíbe '0000000' — inalcançável na prática,
        // só evita loop infinito se a constraint mudar no futuro.
        return candidato;
    }
}
