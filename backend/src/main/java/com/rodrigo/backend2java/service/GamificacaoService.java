package com.rodrigo.backend2java.service;

import com.rodrigo.backend2java.model.HistoricoExecucao;
import com.rodrigo.backend2java.model.dto.request.ExecutionRequestDTO;
import com.rodrigo.backend2java.model.dto.response.ExecutionResponseDTO;
import com.rodrigo.backend2java.model.dto.response.PrimingResponseDTO;
import com.rodrigo.backend2java.repository.BibliotecaTextoRepository;
import com.rodrigo.backend2java.repository.HabitoRepository;
import com.rodrigo.backend2java.repository.HistoricoExecucaoRepository;
import com.rodrigo.backend2java.repository.StatusHabitoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

// @audit-ok [Pré-Tarefa Priming (12) / Execução Timer (20) / Loja Escudo (12) — service de gamificação: priming, execução e compra de escudo]

@Service
@RequiredArgsConstructor
public class GamificacaoService {

    private final HabitoRepository habitoRepository;
    private final StatusHabitoRepository statusHabitoRepository;
    private final HistoricoExecucaoRepository historicoRepository;
    private final BibliotecaTextoRepository bibliotecaRepository;

    // @audit-ok [Pré-Tarefa Priming (13) — busca texto pré-tarefa da biblioteca por categoria e idioma]
    public PrimingResponseDTO obterPriming(final UUID habitoId) {
        final var habito = habitoRepository.findById(habitoId)
                .orElseThrow(() -> new RuntimeException("Hábito não encontrado"));

        final var biblioteca = bibliotecaRepository.findByCategoriaAndIdioma(habito.getCategoria(), "pt-BR")
                .orElse(null);

        // @audit-ok [Pré-Tarefa Priming (14) — usa texto padrão se não houver entrada na biblioteca]
        final var texto = biblioteca != null ? biblioteca.getTextoPreTarefa()
                : "Concentre-se e respire fundo. Você consegue!";

        return new PrimingResponseDTO(texto);
    }

    @Transactional
    public ExecutionResponseDTO processarExecucao(final UUID habitoId, final ExecutionRequestDTO request) {
        // @audit-ok [Execução Timer (21) — verifica idempotência: rejeita execution_token já registrado]
        if (historicoRepository.existsByExecutionToken(request.execution_token())) {
            throw new RuntimeException("Execução duplicada");
        }

        final var habito = habitoRepository.findById(habitoId)
                .orElseThrow(() -> new RuntimeException("Hábito não encontrado"));

        final var status = statusHabitoRepository.findById(habitoId)
                .orElseThrow(() -> new RuntimeException("Status não encontrado"));

        var moedasGanhas = 0;
        var textoFeedback = "Execução registrada!";

        // @audit-ok [Execução Timer (22) — COMPLETE_PADRAO: +100 moedas; incrementa execucoesHoje e dispara diasSeguidos apenas ao atingir a meta exata]
        if ("COMPLETE_PADRAO".equals(request.tipo())) {
            moedasGanhas = 100;
            final int execucoesAntes = status.getExecucoesHoje();
            status.setExecucoesHoje(execucoesAntes + 1);
            if (execucoesAntes + 1 == habito.getMetaFrequenciaDiaria()) {
                status.setDiasSeguidos(status.getDiasSeguidos() + 1);
            }
        // @audit-ok [Execução Timer (23) — COMPLETE_EXTRA: +150 moedas; mesma lógica de diasSeguidos + feedback diferenciado]
        } else if ("COMPLETE_EXTRA".equals(request.tipo())) {
            moedasGanhas = 150;
            final int execucoesAntes = status.getExecucoesHoje();
            status.setExecucoesHoje(execucoesAntes + 1);
            if (execucoesAntes + 1 == habito.getMetaFrequenciaDiaria()) {
                status.setDiasSeguidos(status.getDiasSeguidos() + 1);
            }
            textoFeedback = "Desempenho excelente!";
        // @audit-ok [Desistência (9) — FAIL_TIMEOUT/FAIL_BLOQUEIO: zera diasSeguidos]
        } else if ("FAIL_TIMEOUT".equals(request.tipo()) || "FAIL_BLOQUEIO".equals(request.tipo())) {
            status.setDiasSeguidos(0);
            textoFeedback = "Ofensiva zerada. Recomece amanhã!";
        } else {
            throw new IllegalArgumentException("Tipo de execução inválido: " + request.tipo());
        }

        // @audit-ok [Execução Timer (24) — acumula moedas no status e persiste via JdbcTemplate]
        status.setMoedasLocais(status.getMoedasLocais() + moedasGanhas);
        statusHabitoRepository.update(status);

        // @audit-ok [Execução Timer (25) — registra entrada no histórico de execuções com o execution_token]
        final var historico = HistoricoExecucao.builder()
                .id(UUID.randomUUID())
                .habitoId(habitoId)
                .executionToken(request.execution_token())
                .dataHoraExecucao(OffsetDateTime.now())
                .valorRealizado(request.valor_realizado())
                .moedasGanhas(moedasGanhas)
                .tipoSucesso(request.tipo())
                .build();

        historicoRepository.save(historico);

        // @audit-ok [Execução Timer (26) — retorna ExecutionResponseDTO com moedas ganhas, total e dias_seguidos]
        return ExecutionResponseDTO.builder()
                .moedas_ganhas(moedasGanhas)
                .moedas_totais(status.getMoedasLocais())
                .dias_seguidos(status.getDiasSeguidos())
                .novo_nivel(status.getDiasSeguidos())
                .texto_feedback(textoFeedback)
                .build();
    }

    @Transactional
    public void comprarEscudo(final UUID habitoId) {
        final var status = statusHabitoRepository.findById(habitoId)
                .orElseThrow(() -> new RuntimeException("Status não encontrado"));

        // @audit-ok [Loja Escudo (13) — valida saldo mínimo de 1500 moedas antes de debitar]
        if (status.getMoedasLocais() < 1500) {
            throw new RuntimeException("Saldo insuficiente");
        }

        // @audit-ok [Loja Escudo (14) — debita 1500 moedas e incrementa bloqueiosAcumulados em 1]
        status.setMoedasLocais(status.getMoedasLocais() - 1500);
        status.setBloqueiosAcumulados(status.getBloqueiosAcumulados() + 1);
        statusHabitoRepository.update(status);
    }
}
