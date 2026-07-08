package com.rodrigo.backend.service;

import java.util.UUID;
import java.time.ZoneId;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.stream.Collectors;
import java.time.temporal.ChronoUnit;
import lombok.RequiredArgsConstructor;
import com.rodrigo.backend.model.Habito;
import org.springframework.stereotype.Service;
import com.rodrigo.backend.model.RegistroDiario;
import com.rodrigo.backend.model.TransacaoMoedas;
import com.rodrigo.backend.model.HistoricoExecucao;
import com.rodrigo.backend.model.SubAtividadeStatus;
import com.rodrigo.backend.repository.HabitoRepository;
import com.rodrigo.backend.repository.UsuarioRepository;
import org.springframework.transaction.annotation.Transactional;
import com.rodrigo.backend.repository.SubAtividadeRepository;
import com.rodrigo.backend.repository.RegistroDiarioRepository;
import com.rodrigo.backend.model.dto.response.ExecutionResponseDTO;
import com.rodrigo.backend.repository.TransacaoMoedasRepository;
import com.rodrigo.backend.repository.HistoricoExecucaoRepository;
import com.rodrigo.backend.exception.RecursoNaoEncontradoException;
import com.rodrigo.backend.repository.SubAtividadeStatusRepository;

// @audit-ok [Concluir Dia(2) — apura a recompensa do dia (fim do dia ou "Concluir Hoje"): regra de economia diferida.
//   Base 100 (meta) / 150 (extra ≥120%) descontada proporcionalmente pelas sub-atividades não feitas (regra 3.8).
//   Idempotente: não credita duas vezes o mesmo dia. Sem meta atingida, consome escudo no fechamento (F10/F12).]

@Service
@RequiredArgsConstructor
public class ConclusaoDiaService {

    private final HabitoRepository habitoRepository;
    private final UsuarioRepository usuarioRepository;
    private final RegistroDiarioRepository registroDiarioRepository;
    private final TransacaoMoedasRepository transacaoMoedasRepository;
    private final SubAtividadeRepository subAtividadeRepository;
    private final SubAtividadeStatusRepository subAtividadeStatusRepository;
    private final HistoricoExecucaoRepository historicoRepository;

    // @audit-info [Concluir Dia(2) — resultado interno da apuração de um dia]
    private record Apuracao(int reward, boolean metaConcluida) {
    }

    // @audit-ok [Concluir Dia(2) — endpoint POST /habits/{id}/conclude-day: encerra o dia corrente e credita a recompensa]
    @Transactional
    public ExecutionResponseDTO concluirDia(final UUID habitoId) {
        final var habito = habitoRepository.findById(habitoId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Hábito não encontrado"));
        final var usuario = usuarioRepository.findById(habito.getUsuarioId())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário não encontrado"));
        final ZoneId zona = ZoneId.of(usuario.getFusoHorario());
        final LocalDate hoje = LocalDate.now(zona);

        final Apuracao apuracao = apurarDia(habito, hoje, zona, true);

        final int saldo = transacaoMoedasRepository.findSaldoByHabitoId(habitoId);
        final int escudosBrutos = transacaoMoedasRepository.countByTipoAndHabitoId(habitoId, "DEBITO_ESCUDO");
        final int escudosUsados = historicoRepository.countByTipoSucessoAndHabitoId(habitoId, "FAIL_BLOQUEIO");
        final int streak = OfensivaCalculator.calcular(registroDiarioRepository.findAllByHabitoId(habitoId), hoje);
        final var registroHoje = registroDiarioRepository.findByHabitoIdAndData(habitoId, hoje);
        final int valorTotalDia = registroHoje.map(RegistroDiario::getValorTotalDia).orElse(0);
        final int metaDoDia = registroHoje.map(RegistroDiario::getMetaDoDia).orElse(calcularMetaDoDia(habito, hoje));

        return ExecutionResponseDTO.builder()
                .moedas_ganhas(apuracao.reward())
                .moedas_totais(saldo)
                .dias_seguidos(streak)
                .novo_nivel((streak / 10) * 10)
                .escudos_disponiveis(Math.max(0, escudosBrutos - escudosUsados))
                .valor_total_dia(valorTotalDia)
                .meta_do_dia(metaDoDia)
                .meta_concluida_hoje(apuracao.metaConcluida())
                .texto_feedback(apuracao.metaConcluida()
                        ? "Parabéns! Você atingiu sua meta hoje."
                        : "Meta do dia ainda não atingida.")
                .build();
    }

    // @audit-ok [Fechamento Diário(2) — usado pelo job de virada: apura um dia já encerrado (consome escudo / falha)]
    @Transactional
    public void apurarDiaPassado(final Habito habito, final LocalDate dia, final ZoneId zona) {
        apurarDia(habito, dia, zona, false);
    }

    // @audit-info [Concluir Dia(2) — núcleo idempotente da apuração de um dia]
    private Apuracao apurarDia(final Habito habito, final LocalDate dia, final ZoneId zona, final boolean manual) {
        final UUID habitoId = habito.getId();
        final OffsetDateTime inicio = dia.atStartOfDay(zona).toOffsetDateTime();
        final OffsetDateTime fim = dia.plusDays(1).atStartOfDay(zona).toOffsetDateTime();

        final var registroOpt = registroDiarioRepository.findByHabitoIdAndData(habitoId, dia);
        final int valorTotalDia = registroOpt.map(RegistroDiario::getValorTotalDia).orElse(0);
        final int metaDoDia = registroOpt.map(RegistroDiario::getMetaDoDia).orElse(calcularMetaDoDia(habito, dia));
        final boolean protegido = registroOpt.map(RegistroDiario::getProtegidoPorEscudo).orElse(false);
        final boolean metaConcluida = metaDoDia > 0 && valorTotalDia >= metaDoDia;

        // @audit-info [Concluir Dia(2) — idempotência: se já houve crédito no dia, não credita de novo]
        if (transacaoMoedasRepository.existsCreditoNoDia(habitoId, inicio, fim)) {
            return new Apuracao(0, metaConcluida);
        }

        if (metaConcluida) {
            // @audit-info [Concluir Dia(2) — base 150 se ≥120% da meta, senão 100; desconto proporcional por sub-atividade ausente]
            final int base = valorTotalDia >= metaDoDia * 1.2 ? 150 : 100;
            final double proporcao = proporcaoSubsFeitas(habitoId, dia);
            final int reward = Math.max(0, (int) Math.round(base * proporcao));
            final String tipoTransacao = base == 150 ? "CREDITO_BONUS" : "CREDITO_META";

            transacaoMoedasRepository.save(TransacaoMoedas.builder()
                    .habitoId(habitoId)
                    .tipo(tipoTransacao)
                    .valor(reward)
                    .dataHora(OffsetDateTime.now())
                    .build());

            // @audit-info [Concluir Dia(2) — marca as porções já consideradas como creditadas]
            subAtividadeStatusRepository.findByHabitoIdAndData(habitoId, dia).forEach(s -> {
                if (Boolean.TRUE.equals(s.getExecutada()) && !Boolean.TRUE.equals(s.getMoedasCreditadas())) {
                    s.setMoedasCreditadas(true);
                    subAtividadeStatusRepository.upsert(s);
                }
            });

            registroDiarioRepository.upsert(RegistroDiario.builder()
                    .id(registroOpt.map(RegistroDiario::getId).orElse(null))
                    .habitoId(habitoId)
                    .dataExecucao(dia)
                    .valorTotalDia(valorTotalDia)
                    .metaDoDia(metaDoDia)
                    .status("CONCLUIDO")
                    .horaConclusao(OffsetDateTime.now())
                    .protegidoPorEscudo(protegido)
                    .build());

            return new Apuracao(reward, true);
        }

        // @audit-info [Fechamento Diário(2) — meta não atingida: só fecha dias passados (job); consome escudo se houver (F10)]
        if (!manual && !protegido) {
            final int escudosBrutos = transacaoMoedasRepository.countByTipoAndHabitoId(habitoId, "DEBITO_ESCUDO");
            final int escudosUsados = historicoRepository.countByTipoSucessoAndHabitoId(habitoId, "FAIL_BLOQUEIO");
            final boolean temEscudo = (escudosBrutos - escudosUsados) > 0;

            if (temEscudo) {
                historicoRepository.save(HistoricoExecucao.builder()
                        .id(UUID.randomUUID())
                        .habitoId(habitoId)
                        .subAtividadeId(null)
                        .executionToken(UUID.randomUUID())
                        .dataHoraExecucao(OffsetDateTime.now())
                        .valorRealizado(0)
                        .moedasGanhas(0)
                        .tipoSucesso("FAIL_BLOQUEIO")
                        .build());
            }

            registroDiarioRepository.upsert(RegistroDiario.builder()
                    .id(registroOpt.map(RegistroDiario::getId).orElse(null))
                    .habitoId(habitoId)
                    .dataExecucao(dia)
                    .valorTotalDia(valorTotalDia)
                    .metaDoDia(metaDoDia)
                    .status("FALHA")
                    .horaConclusao(null)
                    .protegidoPorEscudo(temEscudo)
                    .build());
        }

        return new Apuracao(0, false);
    }

    // @audit-info [Concluir Dia(2) — proporção das sub-atividades feitas (soma alvo_parcial executadas / total); 1.0 se não há partes]
    private double proporcaoSubsFeitas(final UUID habitoId, final LocalDate dia) {
        final var subs = subAtividadeRepository.findByHabitoId(habitoId);
        if (subs.isEmpty()) {
            return 1.0;
        }
        final int somaTotal = subs.stream().mapToInt(s -> s.getAlvoParcial() != null ? s.getAlvoParcial() : 0).sum();
        if (somaTotal <= 0) {
            return 1.0;
        }
        final var executadasIds = subAtividadeStatusRepository.findByHabitoIdAndData(habitoId, dia).stream()
                .filter(s -> Boolean.TRUE.equals(s.getExecutada()))
                .map(SubAtividadeStatus::getSubAtividadeId)
                .collect(Collectors.toSet());
        final int somaExec = subs.stream()
                .filter(s -> executadasIds.contains(s.getId()))
                .mapToInt(s -> s.getAlvoParcial() != null ? s.getAlvoParcial() : 0)
                .sum();
        return Math.min(1.0, somaExec / (double) somaTotal);
    }

    // @audit-info [Concluir Dia(2) — regra 3.6: meta do dia conforme progressão (igual ao cálculo da execução)]
    private int calcularMetaDoDia(final Habito habito, final LocalDate dia) {
        if (habito.getDiasParaAumento() == null || habito.getIncrementoMeta() == null) {
            return habito.getMetaBase();
        }
        final long diasPassados = ChronoUnit.DAYS.between(habito.getCriadoEm().toLocalDate(), dia);
        final long ciclos = diasPassados / habito.getDiasParaAumento();
        final int meta = habito.getMetaBase() + (int) (ciclos * habito.getIncrementoMeta());
        return habito.getMetaMaxima() != null ? Math.min(meta, habito.getMetaMaxima()) : meta;
    }
}