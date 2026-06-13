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

@Service
@RequiredArgsConstructor
public class GamificacaoService {

    private final HabitoRepository habitoRepository;
    private final StatusHabitoRepository statusHabitoRepository;
    private final HistoricoExecucaoRepository historicoRepository;
    private final BibliotecaTextoRepository bibliotecaRepository;

    public PrimingResponseDTO obterPriming(final UUID habitoId) {
        final var habito = habitoRepository.findById(habitoId)
                .orElseThrow(() -> new RuntimeException("Hábito não encontrado"));
        
        final var biblioteca = bibliotecaRepository.findByCategoriaAndIdioma(habito.getCategoria(), "pt-BR")
                .orElse(null);

        final var texto = biblioteca != null ? biblioteca.getTextoPreTarefa() : "Concentre-se e respire fundo. Você consegue!";
        
        return new PrimingResponseDTO(texto);
    }

    @Transactional
    public ExecutionResponseDTO processarExecucao(final UUID habitoId, final ExecutionRequestDTO request) {
        if (historicoRepository.existsByExecutionToken(request.execution_token())) {
            throw new RuntimeException("Execução duplicada");
        }

        final var habito = habitoRepository.findById(habitoId)
                .orElseThrow(() -> new RuntimeException("Hábito não encontrado"));
        
        final var status = statusHabitoRepository.findById(habitoId)
                .orElseThrow(() -> new RuntimeException("Status não encontrado"));

        var moedasGanhas = 0;
        var textoFeedback = "Execução registrada!";
        
        if ("COMPLETE_PADRAO".equals(request.tipo())) {
            moedasGanhas = 100;
            status.setExecucoesHoje(status.getExecucoesHoje() + 1);
            if (status.getExecucoesHoje() >= habito.getMetaFrequenciaDiaria()) {
                status.setDiasSeguidos(status.getDiasSeguidos() + 1);
            }
        } else if ("COMPLETE_EXTRA".equals(request.tipo())) {
            moedasGanhas = 150;
            status.setExecucoesHoje(status.getExecucoesHoje() + 1);
            if (status.getExecucoesHoje() >= habito.getMetaFrequenciaDiaria()) {
                status.setDiasSeguidos(status.getDiasSeguidos() + 1);
            }
            textoFeedback = "Desempenho excelente!";
        } else if (request.tipo().startsWith("FAIL")) {
            status.setDiasSeguidos(0);
            textoFeedback = "Ofensiva zerada. Recomece amanhã!";
        }

        status.setMoedasLocais(status.getMoedasLocais() + moedasGanhas);
        statusHabitoRepository.update(status);

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

        if (status.getMoedasLocais() < 1500) {
            throw new RuntimeException("Saldo insuficiente");
        }

        status.setMoedasLocais(status.getMoedasLocais() - 1500);
        status.setBloqueiosAcumulados(status.getBloqueiosAcumulados() + 1);
        statusHabitoRepository.update(status);
    }
}