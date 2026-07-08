package com.rodrigo.backend.service;

import java.util.UUID;
import java.util.Optional;
import java.time.OffsetDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.rodrigo.backend.model.SessaoExecucao;
import com.rodrigo.backend.repository.HabitoRepository;
import com.rodrigo.backend.exception.RegraNegocioException;
import org.springframework.transaction.annotation.Transactional;
import com.rodrigo.backend.repository.SessaoExecucaoRepository;
import com.rodrigo.backend.model.dto.response.SessaoResponseDTO;
import com.rodrigo.backend.model.dto.request.ExecutionRequestDTO;
import com.rodrigo.backend.exception.RecursoNaoEncontradoException;
import com.rodrigo.backend.model.dto.request.SessaoInicioRequestDTO;

// @audit-ok [Execução(2) — service de sessões: controla ciclo de vida do timer persistido (F09, regra 3.7)]

@Service
@RequiredArgsConstructor
public class SessaoExecucaoService {

    // @audit-info [Execução(2) — janela máxima de uma sessão sem retomada antes do timeout (regra 3.7)]
    private static final long DURACAO_SESSAO_HORAS = 1;

    private final HabitoRepository habitoRepository;
    private final SessaoExecucaoRepository sessaoRepository;
    private final GamificacaoService gamificacaoService;

    // @audit-ok [Execução(2) — inicia nova sessão; rejeita se já houver sessão ativa; expira_em é definido pelo servidor (3.7)]
    @Transactional
    public SessaoResponseDTO iniciarSessao(final UUID habitoId, final SessaoInicioRequestDTO request) {
        habitoRepository.findById(habitoId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Hábito não encontrado"));

        // @audit-info [Execução(2) — constraint UNIQUE parcial no banco já garante unicidade; verificação antecipa erro legível]
        sessaoRepository.findAtivaByHabitoId(habitoId).ifPresent(s -> {
            throw new RegraNegocioException("Já existe uma sessão ativa para este hábito");
        });

        // @audit-info [Execução(2) — antifraude: o servidor define expira_em = iniciada_em + 1h; o cliente não decide o prazo]
        final var iniciadaEm = OffsetDateTime.now();
        final var sessao = SessaoExecucao.builder()
                .id(UUID.randomUUID())
                .habitoId(habitoId)
                .subAtividadeId(request.sub_atividade_id())
                .iniciadaEm(iniciadaEm)
                .estado("EM_EXECUCAO")
                .expiraEm(iniciadaEm.plusHours(DURACAO_SESSAO_HORAS))
                .build();

        sessaoRepository.save(sessao);
        return toDTO(sessao);
    }

    // @audit-ok [Execução(2) — pausa sessão ativa e salva valor_parcial acumulado pelo timer do cliente]
    @Transactional
    public SessaoResponseDTO pausarSessao(final UUID sessaoId, final Integer valorParcial) {
        final var sessao = sessaoRepository.findById(sessaoId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Sessão não encontrada"));

        if (!"EM_EXECUCAO".equals(sessao.getEstado())) {
            throw new RegraNegocioException("Sessão não está em execução");
        }

        sessao.setEstado("PAUSADO");
        sessao.setPausadaEm(OffsetDateTime.now());
        if (valorParcial != null) sessao.setValorParcial(valorParcial);

        sessaoRepository.update(sessao);
        return toDTO(sessao);
    }

    // @audit-ok [Execução(2) — retoma sessão pausada; se passou de 1h, falha por timeout em vez de retomar (F09)]
    @Transactional
    public SessaoResponseDTO retomarSessao(final UUID sessaoId) {
        final var sessao = sessaoRepository.findById(sessaoId)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Sessão não encontrada"));

        if (!"PAUSADO".equals(sessao.getEstado())) {
            throw new RegraNegocioException("Sessão não está pausada");
        }

        // @audit-info [Execução(2) — regra 3.7: expirou? registra FAIL_TIMEOUT (sessão vira TIMEOUT) e devolve o estado final]
        if (sessao.getExpiraEm() != null && sessao.getExpiraEm().isBefore(OffsetDateTime.now())) {
            final var timeout = ExecutionRequestDTO.builder()
                    .execution_token(UUID.randomUUID())
                    .tipo("FAIL_TIMEOUT")
                    .valor_realizado(sessao.getValorParcial())
                    .sub_atividade_id(sessao.getSubAtividadeId())
                    .build();
            gamificacaoService.processarExecucao(sessao.getHabitoId(), timeout);
            return toDTO(sessaoRepository.findById(sessaoId).orElse(sessao));
        }

        sessao.setEstado("EM_EXECUCAO");
        sessao.setPausadaEm(null);

        sessaoRepository.update(sessao);
        return toDTO(sessao);
    }

    // @audit-ok [Execução(2) — busca sessão viva do hábito para retomada após minimizar o app]
    public Optional<SessaoResponseDTO> obterSessaoAtiva(final UUID habitoId) {
        return sessaoRepository.findAtivaByHabitoId(habitoId).map(this::toDTO);
    }

    private SessaoResponseDTO toDTO(final SessaoExecucao s) {
        return new SessaoResponseDTO(
                s.getId(), s.getHabitoId(), s.getSubAtividadeId(),
                s.getIniciadaEm(), s.getPausadaEm(),
                s.getValorParcial(), s.getEstado(), s.getExpiraEm());
    }
}
