package com.rodrigo.backend2java.service;
import java.util.UUID;
import java.time.OffsetDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.rodrigo.backend2java.model.HistoricoExecucao;
import com.rodrigo.backend2java.repository.HabitoRepository;
import org.springframework.transaction.annotation.Transactional;
import com.rodrigo.backend2java.repository.UsuarioRepository;
import com.rodrigo.backend2java.repository.StatusHabitoRepository;
import com.rodrigo.backend2java.repository.BibliotecaTextoRepository;
import com.rodrigo.backend2java.model.dto.request.ExecutionRequestDTO;
import com.rodrigo.backend2java.model.dto.response.PrimingResponseDTO;
import com.rodrigo.backend2java.repository.HistoricoExecucaoRepository;
import com.rodrigo.backend2java.repository.SubAtividadeRepository;
import com.rodrigo.backend2java.model.dto.response.ExecutionResponseDTO;
// @audit-ok [Pré-Tarefa Priming (12) / Execução Timer (20) / Loja Escudo (12) — service de gamificação: priming, execução e compra de escudo]
@Service
@RequiredArgsConstructor
public class GamificacaoService {

    // @audit-ok [E1.6 (item 3) — único ponto de configuração do bônus de
    // conclusão. RF22/RNF08 exigem que o cálculo seja exclusivo do servidor —
    // antes disso, era o request.tipo() enviado pelo navegador que escolhia
    // entre estas duas constantes; um cliente modificado podia pedir 150 sempre.]
    private static final int MOEDAS_PADRAO = 100;
    private static final int MOEDAS_EXTRA = 150;
    private static final double MULTIPLICADOR_EXTRA = 1.2;

    private final HabitoRepository habitoRepository;
    private final StatusHabitoRepository statusHabitoRepository;
    private final HistoricoExecucaoRepository historicoRepository;
    private final BibliotecaTextoRepository bibliotecaRepository;
    private final UsuarioRepository usuarioRepository;
    private final ProximoVencimentoService proximoVencimentoService;
    // @audit-ok [E2.8 — usada pra achar o alvo da ocorrência sendo executada
    // (bônus) e o execucoesHoje que ProximoVencimentoService.calcular passou a
    // exigir.]
    private final SubAtividadeRepository subAtividadeRepository;

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
        var bonus = false;

        // @audit-ok [E1.6 — tipoRequisicao só distingue a CATEGORIA do pedido
        // (conclusão vs desistência); dentro de "conclusão", o cliente não
        // decide mais nada. Ausente/em branco também conta como conclusão —
        // é o que o front honesto manda agora (item 4: só execution_token e
        // valor_realizado; ver Execution/index.jsx).]
        final var tipoRequisicao = request.tipo();
        final var ehPedidoDeConclusao = tipoRequisicao == null || tipoRequisicao.isBlank()
                || "COMPLETE_PADRAO".equals(tipoRequisicao) || "COMPLETE_EXTRA".equals(tipoRequisicao);
        final String tipoResultado;

        // @audit-ok [Execução Timer (22)/(23) — RF22/RNF08: o servidor recalcula
        // sozinho se a conclusão foi padrão ou extra a partir de valor_realizado
        // e meta_base. O que request.tipo() afirmar aqui é IGNORADO de propósito
        // — é a própria proteção que esta tarefa pede: um cliente modificado que
        // mande "COMPLETE_EXTRA" mesmo tendo cumprido só a meta exata recebe
        // MOEDAS_PADRAO, não MOEDAS_EXTRA.]
        if (ehPedidoDeConclusao) {
            final int execucoesAntes = status.getExecucoesHoje();

            // @audit-ok [E2.8 — bônus passa a comparar contra o alvo da OCORRÊNCIA
            // sendo executada (sub_alvo), não mais o meta_base do dia inteiro.
            // Antes de sub_atividades virarem parte real do fluxo de execução
            // (E2.8), meta_base era "a única meta que existe"; com várias
            // ocorrências por dia, cada execução só cobre uma fração (sub_alvo), e
            // o gatilho de 120% precisa ser sobre essa fração — senão nenhuma
            // execução isolada de um hábito de N vezes bateria bônus (700 nunca é
            // >= 2100 × 1,2). Pra hábito de 1x/dia o alvo da única ocorrência É o
            // meta_base (divisão por 1), então o comportamento não muda em nada
            // pra nenhum hábito criado antes desta tarefa.
            // Índice = execucoesAntes (não execucoesAntes+1): a ocorrência sendo
            // concluída AGORA é a que ainda não tinha sido contada.]
            final var subAtividades = subAtividadeRepository.findAllByHabitoId(habitoId);
            final var metaDaOcorrencia = subAtividades.isEmpty()
                    ? habito.getMetaBase()
                    : subAtividades.get(Math.min(execucoesAntes, subAtividades.size() - 1)).getAlvo();

            bonus = metaDaOcorrencia != null
                    && request.valor_realizado() >= metaDaOcorrencia * MULTIPLICADOR_EXTRA;
            moedasGanhas = bonus ? MOEDAS_EXTRA : MOEDAS_PADRAO;
            tipoResultado = bonus ? "COMPLETE_EXTRA" : "COMPLETE_PADRAO";

            status.setExecucoesHoje(execucoesAntes + 1);
            // @audit-ok [HOTFIX (achado ao investigar a E4.3) — era
            // habito.getMetaFrequenciaDiaria(): esse campo não tem coluna própria
            // desde o schema v2.1 (é derivado de COUNT(sub_atividades), só
            // materializado em vw_habito_hoje/HabitoHojeRepository, que este
            // service não usa) e o RowMapper de HabitoRepository nunca o
            // preenche — habito.getMetaFrequenciaDiaria() sempre voltava o
            // @Builder.Default=1, fechando a ofensiva do dia na 1ª execução
            // isolada, não importa quantas ocorrências o hábito realmente
            // tivesse. Gap já documentado no cabeçalho de HabitoRepository.java
            // desde a E0.5.3/E2.9 ("repare nisso ao testar a Etapa 1 adiante"),
            // nunca disparado em teste algum porque hábito de mais de 1x/dia só
            // passou a existir de verdade na E2.8, depois da última vez que este
            // trecho foi tocado (E1.6). Reproduzido ao vivo antes desta correção:
            // hábito 3x/dia completava dias_seguidos 0→1 já na 1ª de 3 ocorrências.
            // subAtividades já está em mãos (linha acima, usada pro bônus) — reusa
            // a mesma fonte que a E4.3 já usa corretamente
            // (SubAtividadeRepository.findAllByHabitoId), sem consulta nova.
            // Math.max(1, ...) é o mesmo piso de segurança já usado em
            // StatsService e em vw_habito_hoje (COALESCE(..., 1)) para hábito sem
            // nenhuma sub_atividade.]
            final var totalOcorrenciasDoDia = Math.max(1, subAtividades.size());
            if (execucoesAntes + 1 == totalOcorrenciasDoDia) {
                status.setDiasSeguidos(status.getDiasSeguidos() + 1);
            }
            if (bonus) {
                textoFeedback = "Desempenho excelente!";
            }

            // @audit-ok [E2.1 (item 2) — recalcula proximo_vencimento após toda
            // conclusão bem-sucedida. FAIL_BLOQUEIO/FAIL_TIMEOUT (abaixo) NÃO
            // recalculam de propósito: o vencimento precisa continuar no passado
            // para a expressão "falha" do avatar (Home.jsx, diffMin < -60)
            // aparecer até a próxima virada de dia recalcular pra frente.
            // E2.8 (item 4): passa execucoesHoje (já incrementado, linha acima) —
            // é o que deixa calcular() saber que a próxima pendente avançou.]
            final var usuarioDono = usuarioRepository.findById(habito.getUsuarioId()).orElse(null);
            status.setProximoVencimento(
                    proximoVencimentoService.calcular(habito, usuarioDono, status.getExecucoesHoje()));
        // @audit-ok [Desistência (9) — FAIL_BLOQUEIO: consome um escudo e PRESERVA a ofensiva.
        // Isto NÃO é cálculo de bônus — é a escolha do usuário no GiveUpModal
        // (usar escudo ou assumir falha), algo que o servidor não tem como
        // inferir de valor_realizado. Fora do escopo da E1.6.]
        } else if ("FAIL_BLOQUEIO".equals(tipoRequisicao)) {
            if (status.getBloqueiosAcumulados() <= 0) {
                throw new RuntimeException("Nenhum escudo disponível para proteger a ofensiva");
            }
            if (Boolean.TRUE.equals(status.getBloqueioUsadoHoje())) {
                throw new RuntimeException("Escudo já utilizado hoje neste hábito");
            }
            status.setBloqueiosAcumulados(status.getBloqueiosAcumulados() - 1);
            status.setBloqueioUsadoHoje(true);
            textoFeedback = "Ofensiva protegida pelo escudo!";
            tipoResultado = tipoRequisicao;
        // @audit-ok [Desistência (9) — FAIL_TIMEOUT: zera diasSeguidos]
        } else if ("FAIL_TIMEOUT".equals(tipoRequisicao)) {
            status.setDiasSeguidos(0);
            textoFeedback = "Ofensiva zerada. Recomece amanhã!";
            tipoResultado = tipoRequisicao;
        } else {
            throw new IllegalArgumentException("Tipo de execução inválido: " + tipoRequisicao);
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
                .tipoSucesso(mapearTipoSucesso(tipoResultado))
                .build();

        historicoRepository.save(historico);

        // @audit-ok [Execução Timer (26) / E1.6 (item 5) — devolve "bonus"
        // explicitamente para a tela de Sucesso não precisar mais adivinhar
        // 100/150 a partir de nada: usa só o que veio daqui.]
        return ExecutionResponseDTO.builder()
                .moedas_ganhas(moedasGanhas)
                .moedas_totais(status.getMoedasLocais())
                .dias_seguidos(status.getDiasSeguidos())
                .novo_nivel(status.getDiasSeguidos())
                .texto_feedback(textoFeedback)
                .bonus(bonus)
                .build();
    }

    // @audit-ok [Schema v2.1 — achado fora do escopo original da E0.5.3, mas
    // necessário para a persistência não quebrar: o CHECK ck_his_tipo da
    // tabela historico_execucoes só aceita COMPLETE_PADRAO, COMPLETE_EXTRA,
    // DESISTENCIA, PROTEGIDO_ESCUDO e PROTEGIDO_AUTOMATICO. O vocabulário de
    // ExecutionRequestDTO.tipo() (usado antes desta tarefa como valor direto
    // de tipoSucesso) inclui FAIL_BLOQUEIO e FAIL_TIMEOUT, que violariam esse
    // CHECK. Esta tradução é o mínimo para o INSERT continuar funcionando —
    // PROTEGIDO_AUTOMATICO fica reservado para o escudo automático da meia-
    // noite (D2/E4.3), que não passa por aqui.
    private String mapearTipoSucesso(final String tipoRequisicao) {
        return switch (tipoRequisicao) {
            case "FAIL_BLOQUEIO" -> "PROTEGIDO_ESCUDO";
            case "FAIL_TIMEOUT" -> "DESISTENCIA";
            default -> tipoRequisicao; // COMPLETE_PADRAO / COMPLETE_EXTRA já batem com o CHECK
        };
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
