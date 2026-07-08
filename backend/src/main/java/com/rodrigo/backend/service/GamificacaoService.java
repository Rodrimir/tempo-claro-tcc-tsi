package com.rodrigo.backend.service;

import java.util.Map;
import java.util.UUID;
import java.time.ZoneId;
import java.time.LocalDate;
import java.time.OffsetDateTime;
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
import com.rodrigo.backend.exception.RegraNegocioException;
import org.springframework.transaction.annotation.Transactional;
import com.rodrigo.backend.repository.SubAtividadeRepository;
import com.rodrigo.backend.repository.RegistroDiarioRepository;
import com.rodrigo.backend.repository.SessaoExecucaoRepository;
import com.rodrigo.backend.repository.BibliotecaTextoRepository;
import com.rodrigo.backend.repository.TransacaoMoedasRepository;
import com.rodrigo.backend.model.dto.request.ExecutionRequestDTO;
import com.rodrigo.backend.model.dto.response.PrimingResponseDTO;
import com.rodrigo.backend.repository.HistoricoExecucaoRepository;
import com.rodrigo.backend.exception.RecursoNaoEncontradoException;
import com.rodrigo.backend.model.dto.response.ExecutionResponseDTO;
import com.rodrigo.backend.repository.SubAtividadeStatusRepository;

// @audit-ok [Priming(2) / Execução(2) / Loja(2) — service de gamificação: priming, execução completa e compra de escudo]

@Service
@RequiredArgsConstructor
public class GamificacaoService {

    private final HabitoRepository habitoRepository;
    private final UsuarioRepository usuarioRepository;
    private final HistoricoExecucaoRepository historicoRepository;
    private final TransacaoMoedasRepository transacaoMoedasRepository;
    private final RegistroDiarioRepository registroDiarioRepository;
    private final SubAtividadeRepository subAtividadeRepository;
    private final SubAtividadeStatusRepository subAtividadeStatusRepository;
    private final SessaoExecucaoRepository sessaoExecucaoRepository;
    private final BibliotecaTextoRepository bibliotecaRepository;

    // @audit-ok [Priming(2) — busca texto pré-tarefa da biblioteca por categoriaId; usa texto genérico como fallback]
    public PrimingResponseDTO obterPriming(final UUID habitoId) {
        final var habito = habitoRepository.findById(habitoId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Hábito não encontrado"));

        // @audit-info [Priming(2) — tenta texto específico da categoria; cai no genérico (categoriaId IS NULL) se ausente]
        final var texto = bibliotecaRepository
                .findByCategoriaIdAndIdioma(habito.getCategoriaId(), "pt-BR")
                .or(() -> bibliotecaRepository.findGenericoByIdioma("pt-BR"))
                .map(b -> b.getTextoPreTarefa())
                .orElse("Concentre-se e respire fundo. Você consegue!");

        return new PrimingResponseDTO(texto);
    }

    // @audit-ok [Execução(2) — registra a execução SEM creditar moedas: a recompensa é apurada no fim do dia / "Concluir Hoje".
    //   Acumula o valor no registro do dia e atualiza o estado da sub-atividade (executada). Antifraude: servidor deriva o tipo.]
    @Transactional
    public ExecutionResponseDTO processarExecucao(final UUID habitoId, final ExecutionRequestDTO request) {
        // @audit-info [Execução(2) — verifica idempotência: rejeita execution_token já registrado]
        if (historicoRepository.existsByExecutionToken(request.execution_token())) {
            throw new RegraNegocioException("Execução duplicada");
        }

        final var habito = habitoRepository.findById(habitoId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Hábito não encontrado"));

        if (!request.tipo().matches("COMPLETE_PADRAO|COMPLETE_EXTRA|FAIL_TIMEOUT|FAIL_BLOQUEIO")) {
            throw new RegraNegocioException("Tipo de execução inválido: " + request.tipo());
        }

        final var usuario = usuarioRepository.findById(habito.getUsuarioId())
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário não encontrado"));
        final LocalDate hoje = LocalDate.now(ZoneId.of(usuario.getFusoHorario()));

        // @audit-info [Execução(2) — regra 3.6: meta do dia cresce por ciclos de dias_para_aumento × incremento_meta]
        final int metaDoDia = calcularMetaDoDia(habito, hoje);

        // @audit-info [Execução(2) — alvo de referência: a porção da sub-atividade (escalada pela progressão) ou a meta cheia]
        final int alvoReferencia;
        if (request.sub_atividade_id() != null) {
            final var sub = subAtividadeRepository.findById(request.sub_atividade_id())
                    .orElseThrow(() -> new RecursoNaoEncontradoException("Sub-atividade não encontrada"));
            alvoReferencia = (int) Math.round(sub.getAlvoParcial() * (metaDoDia / (double) habito.getMetaBase()));
        } else {
            alvoReferencia = metaDoDia;
        }

        // @audit-info [Execução(2) — antifraude (RNF08): o servidor deriva o tipo de sucesso por valor × alvo (apenas para registro)]
        final String tipoSucesso = derivarTipoSucesso(request.tipo(), request.valor_realizado(), alvoReferencia);

        // @audit-info [Execução(2) — grava o fato; moedas_ganhas = 0 pois o crédito é diferido para o fechamento do dia]
        historicoRepository.save(HistoricoExecucao.builder()
                .id(UUID.randomUUID())
                .habitoId(habitoId)
                .subAtividadeId(request.sub_atividade_id())
                .executionToken(request.execution_token())
                .dataHoraExecucao(OffsetDateTime.now())
                .valorRealizado(request.valor_realizado())
                .moedasGanhas(0)
                .tipoSucesso(tipoSucesso)
                .build());

        // @audit-info [Execução(2) — atualiza o estado da sub-atividade do dia sem creditar (regra 3.8; crédito vem no fechamento)]
        if (request.sub_atividade_id() != null) {
            final var statusAnterior = subAtividadeStatusRepository
                    .findBySubAtividadeIdAndData(request.sub_atividade_id(), hoje);
            final int valorAcumParte = statusAnterior.map(SubAtividadeStatus::getValorRealizado).orElse(0)
                    + request.valor_realizado();
            subAtividadeStatusRepository.upsert(SubAtividadeStatus.builder()
                    .id(statusAnterior.map(SubAtividadeStatus::getId).orElse(null))
                    .subAtividadeId(request.sub_atividade_id())
                    .dataExecucao(hoje)
                    .valorRealizado(valorAcumParte)
                    .executada(valorAcumParte >= alvoReferencia)
                    .moedasCreditadas(false)
                    .build());
        }

        // @audit-info [Execução(2) — acumula valor do dia; uma falha de pré-tarefa não zera o dia (a falha é apurada na virada)]
        final var registroAnterior = registroDiarioRepository.findByHabitoIdAndData(habitoId, hoje);
        final int valorTotalDia = registroAnterior.map(RegistroDiario::getValorTotalDia).orElse(0)
                + request.valor_realizado();
        final boolean metaConcluida = valorTotalDia >= metaDoDia;

        registroDiarioRepository.upsert(RegistroDiario.builder()
                .id(registroAnterior.map(RegistroDiario::getId).orElse(null))
                .habitoId(habitoId)
                .dataExecucao(hoje)
                .valorTotalDia(valorTotalDia)
                .metaDoDia(metaDoDia)
                .status(metaConcluida ? "CONCLUIDO" : "PARCIAL")
                .horaConclusao(metaConcluida ? OffsetDateTime.now() : null)
                .protegidoPorEscudo(registroAnterior.map(RegistroDiario::getProtegidoPorEscudo).orElse(false))
                .build());

        // @audit-info [Execução(2) — encerra a sessão viva do hábito: TIMEOUT se foi falha por tempo, senão FINALIZADA (F09)]
        fecharSessaoAtiva(habitoId, tipoSucesso);

        final int streak = calcularStreak(habitoId, usuario.getFusoHorario());
        final int moedaTotal = transacaoMoedasRepository.findSaldoByHabitoId(habitoId);
        final int escudosBrutos = transacaoMoedasRepository.countByTipoAndHabitoId(habitoId, "DEBITO_ESCUDO");
        final int escudosUsados = historicoRepository.countByTipoSucessoAndHabitoId(habitoId, "FAIL_BLOQUEIO");
        final int escudosDisponiveis = Math.max(0, escudosBrutos - escudosUsados);
        final String textoFeedback = obterTextoFeedback(habito.getCategoriaId(), tipoSucesso, "pt-BR");

        // @audit-info [Execução(2) — resposta de PROGRESSO: moedas_ganhas=0 (recompensa só no fechamento); envia progresso do dia]
        return ExecutionResponseDTO.builder()
                .moedas_ganhas(0)
                .moedas_totais(moedaTotal)
                .dias_seguidos(streak)
                .novo_nivel((streak / 10) * 10)
                .escudos_disponiveis(escudosDisponiveis)
                .valor_total_dia(valorTotalDia)
                .meta_do_dia(metaDoDia)
                .meta_concluida_hoje(metaConcluida)
                .texto_feedback(textoFeedback)
                .build();
    }

    // @audit-ok [Loja(2) — valida saldo ≥ 1500 e debita DEBITO_ESCUDO no ledger; retorna saldo e inventário atualizados]
    @Transactional
    public Map<String, Integer> comprarEscudo(final UUID habitoId) {
        habitoRepository.findById(habitoId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Hábito não encontrado"));

        // @audit-info [Loja(2) — regra: escudo custa 1500 moedas; saldo é SUM(valor) do ledger, não coluna cacheada]
        final int saldoAtual = transacaoMoedasRepository.findSaldoByHabitoId(habitoId);
        if (saldoAtual < 1500) {
            throw new RegraNegocioException("Saldo insuficiente. Necessário: 1500, disponível: " + saldoAtual);
        }

        transacaoMoedasRepository.save(TransacaoMoedas.builder()
                .habitoId(habitoId)
                .tipo("DEBITO_ESCUDO")
                .valor(-1500)
                .dataHora(OffsetDateTime.now())
                .build());

        final int novoSaldo = transacaoMoedasRepository.findSaldoByHabitoId(habitoId);
        final int escudosBrutos = transacaoMoedasRepository.countByTipoAndHabitoId(habitoId, "DEBITO_ESCUDO");
        final int escudosUsados = historicoRepository.countByTipoSucessoAndHabitoId(habitoId, "FAIL_BLOQUEIO");
        return Map.of("saldo", novoSaldo, "escudos", Math.max(0, escudosBrutos - escudosUsados));
    }

    // @audit-info [Execução(2) — encerra a sessão viva do hábito ao concluir/falhar a execução (F09)]
    private void fecharSessaoAtiva(final UUID habitoId, final String tipoSucesso) {
        sessaoExecucaoRepository.findAtivaByHabitoId(habitoId).ifPresent(sessao -> {
            sessao.setEstado("FAIL_TIMEOUT".equals(tipoSucesso) ? "TIMEOUT" : "FINALIZADA");
            sessaoExecucaoRepository.update(sessao);
        });
    }

    private int calcularMetaDoDia(final Habito habito, final LocalDate hoje) {
        if (habito.getDiasParaAumento() == null || habito.getIncrementoMeta() == null) {
            return habito.getMetaBase();
        }
        final long diasPassados = ChronoUnit.DAYS.between(habito.getCriadoEm().toLocalDate(), hoje);
        final long ciclos = diasPassados / habito.getDiasParaAumento();
        final int meta = habito.getMetaBase() + (int) (ciclos * habito.getIncrementoMeta());
        return habito.getMetaMaxima() != null ? Math.min(meta, habito.getMetaMaxima()) : meta;
    }

    // @audit-info [Execução(2) — antifraude: falhas vêm do cliente (desistência/timeout); a recompensa COMPLETE é decidida pelo servidor por valor × alvo]
    private String derivarTipoSucesso(final String tipoCliente, final int valorRealizado, final int alvo) {
        if (tipoCliente.startsWith("FAIL_")) {
            return tipoCliente;
        }
        return valorRealizado >= alvo * 1.2 ? "COMPLETE_EXTRA" : "COMPLETE_PADRAO";
    }

    private int calcularStreak(final UUID habitoId, final String fusoHorario) {
        final var registros = registroDiarioRepository.findAllByHabitoId(habitoId);
        return OfensivaCalculator.calcular(registros, LocalDate.now(ZoneId.of(fusoHorario)));
    }

    private String obterTextoFeedback(final UUID categoriaId, final String tipo, final String idioma) {
        final var biblioteca = bibliotecaRepository.findByCategoriaIdAndIdioma(categoriaId, idioma)
                .or(() -> bibliotecaRepository.findGenericoByIdioma(idioma));
        if (biblioteca.isEmpty()) {
            return tipo.startsWith("FAIL_")
                    ? "Amanhã é um novo começo. Nunca falhe duas vezes."
                    : "Excelente trabalho! Continue assim.";
        }
        final var b = biblioteca.get();
        return switch (tipo) {
            case "COMPLETE_EXTRA" -> b.getTextoSucessoExtra() != null
                    ? b.getTextoSucessoExtra() : b.getTextoSucessoPadrao();
            case "COMPLETE_PADRAO" -> b.getTextoSucessoPadrao();
            default -> b.getTextoAvisoUrgencia() != null
                    ? b.getTextoAvisoUrgencia() : "Amanhã é um novo começo. Nunca falhe duas vezes.";
        };
    }
}
