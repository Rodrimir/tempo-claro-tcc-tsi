package com.rodrigo.backend2java.service;
import java.util.UUID;
import java.util.List;
import java.time.LocalTime;
import java.util.ArrayList;
import java.time.OffsetDateTime;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import com.rodrigo.backend2java.model.Habito;
import org.springframework.stereotype.Service;
import com.rodrigo.backend2java.model.StatusHabito;
import com.rodrigo.backend2java.model.SubAtividade;
import com.rodrigo.backend2java.repository.HabitoRepository;
import com.rodrigo.backend2java.repository.UsuarioRepository;
import org.springframework.transaction.annotation.Transactional;
import com.rodrigo.backend2java.repository.HabitoHojeRepository;
import com.rodrigo.backend2java.repository.StatusHabitoRepository;
import com.rodrigo.backend2java.repository.SubAtividadeRepository;
import com.rodrigo.backend2java.model.dto.request.HabitoRequestDTO;
import com.rodrigo.backend2java.model.dto.request.HabitoRequestDTO.OcorrenciaRequestDTO;
import com.rodrigo.backend2java.model.dto.response.HabitoResponseDTO;
// @audit-ok [Dashboard (7) / Criar Hábito (16) — service de hábitos: CRUD e montagem do HabitoResponseDTO]
@Service
@RequiredArgsConstructor
public class HabitoService {

        /**
         * RF03 — o usuário pode manter no máximo 2 hábitos ativos simultâneos.
         * O foco isolado (RNF02) é a premissa do app: mais de dois hábitos em
         * paralelo recria a lista de tarefas que o Tempo Claro existe para evitar.
         *
         * @audit-ok [E1.3 — público de propósito: HabitoController expõe este
         * valor em GET /api/dashboard (DashboardResponseDTO.limite_habitos_ativos)
         * para o front nunca precisar repetir o número por conta própria.]
         */
        public static final int LIMITE_HABITOS_ATIVOS = 2;

        // ck_sub_ordem do schema v2.1 permite sub_ordem só entre 1 e 12.
        private static final int MAX_VEZES_AO_DIA = 12;

        // Horário padrão quando nenhum é informado (item 1 da E0.5.5).
        private static final LocalTime HORARIO_PADRAO = LocalTime.of(23, 59);

        private final HabitoRepository habitoRepository;
        private final StatusHabitoRepository statusHabitoRepository;
        private final UsuarioRepository usuarioRepository;
        private final SubAtividadeRepository subAtividadeRepository;
        private final HabitoHojeRepository habitoHojeRepository;
        private final ProximoVencimentoService proximoVencimentoService;

        @Transactional
        public HabitoResponseDTO criarHabito(final String emailContexto, final HabitoRequestDTO request) {
                // @audit-ok [Criar Hábito (17) — busca usuário e valida limite de 2 hábitos ativos (RF03)]
                final var usuario = usuarioRepository.findByEmail(emailContexto)
                                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

                final var habitosAtivos = habitoRepository.findAllByUsuarioId(usuario.getId());
                if (habitosAtivos.size() >= LIMITE_HABITOS_ATIVOS) {
                        throw new RuntimeException(
                                        "Limite de " + LIMITE_HABITOS_ATIVOS + " hábitos ativos atingido");
                }

                final var habitoId = UUID.randomUUID();

                // @audit-ok [Criar Hábito (18) — monta entidade Habito a partir do DTO da requisição]
                final var habito = Habito.builder()
                                .id(habitoId)
                                .usuarioId(usuario.getId())
                                .titulo(request.titulo())
                                .categoria(request.categoria())
                                .gatilhoAncora(request.gatilho_ancora())
                                .tipoMedida(request.tipo_medida())
                                .modalidade(request.modalidade())
                                .horarioAgendado(request.horario_agendado())
                                .metaBase(request.meta_base())
                                .metaFrequenciaDiaria(request.meta_frequencia_diaria() != null
                                                ? request.meta_frequencia_diaria()
                                                : 1)
                                // @audit-ok [E2.3 — meta_maxima fica null quando omitido (é o valor
                                // válido de "sem teto"); incremento/dias_incremento recebem em Java
                                // o mesmo default que o schema aplicaria via DEFAULT, porque agora
                                // essas colunas entram explicitamente no INSERT (ver HabitoRepository)
                                // e são NOT NULL — um bind nulo quebraria a constraint, não o CHECK.]
                                .metaMaxima(request.meta_maxima())
                                .incremento(request.incremento() != null ? request.incremento() : 0)
                                .diasIncremento(request.dias_incremento() != null ? request.dias_incremento() : 10)
                                // @audit-ok [E2.4 — omitido/branco vira '1111111' (todo dia), mesmo
                                // default do schema — preserva o comportamento de antes desta
                                // tarefa para quem não manda o campo.]
                                .frequenciaSemanal(request.frequencia_semanal() != null
                                                && !request.frequencia_semanal().isBlank()
                                                                ? request.frequencia_semanal()
                                                                : "1111111")
                                .ativo(true)
                                .criadoEm(OffsetDateTime.now())
                                .build();

                habitoRepository.save(habito);

                // @audit-ok [E0.5.5 — gera as sub_atividades do hábito. No schema v2.1 não
                // existe mais a coluna meta_frequencia_diaria: a CONTAGEM de linhas em
                // sub_atividades é a meta de frequência diária (vw_habito_hoje). Um hábito
                // sem sub_atividade fica invisível para essa view — por isso todo hábito
                // criado sai daqui com pelo menos 1 linha.
                // E2.1: gerado ANTES do status porque proximo_vencimento precisa do
                // horário de referência (sub_ordem=1) já salvo no banco.]
                gerarSubAtividades(habitoId, request.meta_base(), request.meta_frequencia_diaria(),
                                request.horario_agendado(), request.ocorrencias())
                                .forEach(subAtividadeRepository::save);

                // @audit-ok [Criar Hábito (19) — cria status inicial zerado vinculado ao novo hábito.
                // E2.1 (item 1) — proximo_vencimento deixa de nascer nulo: calcula a
                // próxima ocorrência a partir do horário da sub_atividade e do fuso do
                // usuário. Antes disso o campo nunca recebia valor nenhum, e a expressão
                // do avatar ficava travada em "normal" para todo hábito.
                // E2.8 (item 4): 0 execuções hoje — hábito acabou de nascer, a primeira
                // ocorrência (sub_ordem=1) é sempre a próxima pendente.]
                final var status = StatusHabito.builder()
                                .habitoId(habitoId)
                                .moedasLocais(0)
                                .bloqueiosAcumulados(0)
                                .diasSeguidos(0)
                                .execucoesHoje(0)
                                .proximoVencimento(proximoVencimentoService.calcular(habito, usuario, 0))
                                .bloqueioUsadoHoje(false)
                                .build();

                statusHabitoRepository.save(status);

                // @audit-ok [Criar Hábito (20) — retorna hábito completo com status zerado]
                return buscarDetalhadoPorId(habitoId);
        }

        // @audit-ok [Dashboard (8) — lista todos os hábitos ativos e agrega status para cada um]
        public List<HabitoResponseDTO> listarDashboard(final String emailContexto) {
                final var usuario = usuarioRepository.findByEmail(emailContexto)
                                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

                return habitoRepository.findAllByUsuarioId(usuario.getId()).stream()
                                .map(h -> buscarDetalhadoPorId(h.getId()))
                                .collect(Collectors.toList());
        }

        // @audit-ok [Dashboard (9) / E1.1 — antes fazia o JOIN lógico em Java entre
        // Habito e StatusHabito; agora lê vw_habito_hoje inteira de uma vez só
        // (HabitoHojeRepository), que já traz status/meta_frequencia_diaria
        // derivados no banco. Não reescreve a regra de COMPLETED/PENDING em Java —
        // só consome o que a view já calculou.]
        public HabitoResponseDTO buscarDetalhadoPorId(final UUID habitoId) {
                final var base = habitoHojeRepository.findByHabitoId(habitoId)
                                .orElseThrow(() -> new RuntimeException("Hábito não encontrado"));
                return enriquecerComOcorrenciaAtual(base);
        }

        // @audit-ok [E2.8 (item 3) — "a ocorrência atual" é a próxima sub_atividade
        // pendente hoje: índice = execucoes_hoje (0-based) na lista já ordenada por
        // sub_ordem, ou a última se todas já foram cumpridas. Mesma indexação usada
        // em ProximoVencimentoService (item 4) e GamificacaoService (bônus por
        // ocorrência) — as três leituras do mesmo conceito, cada uma no seu
        // contexto. vw_habito_hoje agrega no nível do hábito; não dá pra expressar
        // "a ocorrência atual" como coluna simples sem um LATERAL join, então isto
        // fica em Java.]
        private HabitoResponseDTO enriquecerComOcorrenciaAtual(final HabitoResponseDTO base) {
                final var subAtividades = subAtividadeRepository.findAllByHabitoId(base.id());
                if (subAtividades.isEmpty()) {
                        return base;
                }
                final var indice = Math.min(base.execucoes_hoje(), subAtividades.size() - 1);
                final var ocorrenciaAtual = subAtividades.get(indice);
                // @audit-ok [E4.2 (item 2) — lista completa, não só a atual:
                // a tela de edição precisa do horário de CADA ocorrência pra
                // pré-preencher um hábito de mais de 1x/dia, não só a próxima
                // pendente. subAtividades já vem ordenada por sub_ordem
                // (FIND_ALL_BY_HABITO_ID), então o índice bate com o da lista
                // "ocorrencias" que o formulário usa no frontend.]
                final var todasAsOcorrencias = subAtividades.stream()
                                .map(sa -> HabitoResponseDTO.OcorrenciaResponseDTO.builder()
                                                .horario_inicio(sa.getHorarioInicio())
                                                .horario_fim(sa.getHorarioFim())
                                                .alvo(sa.getAlvo())
                                                .build())
                                .toList();
                return base.toBuilder()
                                .alvo_ocorrencia_atual(ocorrenciaAtual.getAlvo())
                                .horario_ocorrencia_atual(ocorrenciaAtual.getHorarioInicio())
                                .ocorrencias(todasAsOcorrencias)
                                .build();
        }

        @Transactional
        public void atualizarHabito(final UUID habitoId, final HabitoRequestDTO request) {
                final var habito = habitoRepository.findById(habitoId)
                                .orElseThrow(() -> new RuntimeException("Hábito não encontrado"));

                // @audit-ok [E2.9 (item 4) — antes só título e meta_base eram
                // considerados numa edição; os outros 11 campos do request eram
                // aceitos pela API (passavam por @Valid sem erro) e descartados em
                // silêncio. Mesmo default de campo omitido que criarHabito usa —
                // PUT é "substitua pelo que veio", não um PATCH parcial.]
                habito.setTitulo(request.titulo());
                habito.setCategoria(request.categoria());
                habito.setGatilhoAncora(request.gatilho_ancora());
                habito.setTipoMedida(request.tipo_medida());
                habito.setModalidade(request.modalidade());
                habito.setMetaBase(request.meta_base());
                habito.setMetaMaxima(request.meta_maxima());
                habito.setIncremento(request.incremento() != null ? request.incremento() : 0);
                habito.setDiasIncremento(request.dias_incremento() != null ? request.dias_incremento() : 10);
                habito.setFrequenciaSemanal(request.frequencia_semanal() != null
                                && !request.frequencia_semanal().isBlank()
                                                ? request.frequencia_semanal()
                                                : "1111111");

                habitoRepository.update(habito);

                // @audit-ok [E0.5.5 (item 4) — recalcula as sub_atividades: apaga as
                // antigas e gera de novo a partir da meta_base/frequência atuais, para a
                // soma dos sub_alvo nunca ficar dessincronizada de hab_meta_base depois de
                // uma edição. his_sub_atividade_id é ON DELETE SET NULL, então apagar aqui
                // não derruba histórico de execução nenhum.]
                subAtividadeRepository.deleteAllByHabitoId(habitoId);
                gerarSubAtividades(habitoId, request.meta_base(), request.meta_frequencia_diaria(),
                                request.horario_agendado(), request.ocorrencias())
                                .forEach(subAtividadeRepository::save);

                // @audit-ok [E2.1 — achado além do prompt original, mas necessário: se o
                // horário mudou na edição, o proximo_vencimento antigo (calculado a partir
                // do horário anterior) ficaria errado até a próxima conclusão ou virada de
                // dia. Recalcula aqui pela mesma razão que recalcula em criarHabito.
                // E2.8 (item 4): usa o execucoes_hoje ATUAL do status (não 0) — editar um
                // hábito no meio do dia não deveria fingir que nenhuma ocorrência de hoje
                // foi cumprida.]
                final var usuarioDono = usuarioRepository.findById(habito.getUsuarioId()).orElse(null);
                statusHabitoRepository.findById(habitoId).ifPresent(status -> {
                        status.setProximoVencimento(
                                        proximoVencimentoService.calcular(habito, usuarioDono, status.getExecucoesHoje()));
                        statusHabitoRepository.update(status);
                });
        }

        // @audit-ok [E0.5.5 — gera N sub_atividades repartindo metaBase igualmente
        // entre elas, jogando o resto na última (regra do plano). Pacote-privado (não
        // private) de propósito: HabitoServiceSubAtividadeTest testa isso direto, sem
        // precisar simular criarHabito inteiro.]
        List<SubAtividade> gerarSubAtividades(final UUID habitoId, final Integer metaBase,
                        final Integer vezesAoDiaRequisitado, final LocalTime horarioAgendado) {
                return gerarSubAtividades(habitoId, metaBase, vezesAoDiaRequisitado, horarioAgendado, null);
        }

        // @audit-ok [E0.5.5 — gera N sub_atividades repartindo metaBase igualmente
        // entre elas, jogando o resto na última (regra do plano). Pacote-privado (não
        // private) de propósito: HabitoServiceSubAtividadeTest testa isso direto, sem
        // precisar simular criarHabito inteiro.
        //
        // E2.8 (item 1) — ganhou o parâmetro "ocorrencias": quando presente e do
        // mesmo tamanho de vezesAoDia, cada sub_atividade usa o horário da SUA
        // própria entrada (permite horários distintos por ocorrência); senão, cai
        // no comportamento de antes desta tarefa (um horário só, horarioAgendado,
        // repetido em todas). O overload de 4 argumentos acima existe só pra não
        // obrigar toda chamada pré-E2.8 (FechamentoDiarioJob, os testes) a passar
        // null explicitamente.]
        List<SubAtividade> gerarSubAtividades(final UUID habitoId, final Integer metaBase,
                        final Integer vezesAoDiaRequisitado, final LocalTime horarioAgendado,
                        final List<OcorrenciaRequestDTO> ocorrencias) {
                final var vezesAoDia = vezesAoDiaRequisitado != null && vezesAoDiaRequisitado > 0
                                ? vezesAoDiaRequisitado
                                : 1;

                if (vezesAoDia > MAX_VEZES_AO_DIA) {
                        throw new RuntimeException(
                                        "Frequência diária máxima é " + MAX_VEZES_AO_DIA + " vezes ao dia");
                }
                if (metaBase == null || metaBase < vezesAoDia) {
                        throw new RuntimeException(
                                        "A meta base deve ser maior ou igual à frequência diária (" + vezesAoDia
                                                        + "x) para poder repartir a meta entre as ocorrências");
                }

                // @audit-ok [E2.8 (item 1) — usa horários individuais só quando a lista
                // bate exatamente com o número de ocorrências; qualquer outra coisa
                // (ausente, tamanho errado) cai no horário único de sempre, tratado
                // pela checagem da E2.6 logo abaixo.]
                final var usaOcorrenciasIndividuais = ocorrencias != null && ocorrencias.size() == vezesAoDia;
                if (usaOcorrenciasIndividuais) {
                        for (final var ocorrencia : ocorrencias) {
                                if (ocorrencia.horario_inicio() == null) {
                                        throw new RuntimeException(
                                                        "Informe o horário de início de cada ocorrência");
                                }
                        }
                } else if (vezesAoDia > 1 && horarioAgendado == null) {
                        // @audit-ok [E2.6 (item 6) — mesma regra do formulário
                        // (CreateHabit.jsx): com mais de 1 ocorrência ao dia
                        // compartilhando o mesmo horário, deixar em branco faria todas
                        // caírem em HORARIO_PADRAO (23:59) sem o usuário ter escolhido
                        // isso. GamificacaoService/FechamentoDiarioJob nunca chamam este
                        // método com horarioAgendado nulo E sem ocorrencias ao mesmo
                        // tempo (sempre derivam de sub_atividades já existentes), então
                        // esta checagem só pode disparar via criarHabito/atualizarHabito.]
                        throw new RuntimeException(
                                        "Informe o horário de execução (obrigatório com mais de 1 vez ao dia)");
                }

                final var horarioUnico = horarioAgendado != null ? horarioAgendado : HORARIO_PADRAO;
                final var alvoBase = metaBase / vezesAoDia;
                final var resto = metaBase % vezesAoDia;

                final var subAtividades = new ArrayList<SubAtividade>();
                for (var ordem = 1; ordem <= vezesAoDia; ordem++) {
                        final var alvo = alvoBase + (ordem == vezesAoDia ? resto : 0);
                        final var construtor = SubAtividade.builder()
                                        .id(UUID.randomUUID())
                                        .habitoId(habitoId)
                                        .ordem(ordem)
                                        .alvo(alvo);
                        if (usaOcorrenciasIndividuais) {
                                final var ocorrencia = ocorrencias.get(ordem - 1);
                                construtor.horarioInicio(ocorrencia.horario_inicio())
                                                .horarioFim(ocorrencia.horario_fim());
                        } else {
                                construtor.horarioInicio(horarioUnico);
                        }
                        subAtividades.add(construtor.build());
                }

                // @audit-ok [Item 3 da E0.5.5 — validação defensiva: com as duas guardas
                // acima (vezesAoDia > 0 e metaBase >= vezesAoDia), a soma SEMPRE fecha com
                // metaBase por construção. Fica como assertiva de segurança contra
                // regressão futura no cálculo, não como validação de entrada do usuário.]
                final var soma = subAtividades.stream().mapToInt(SubAtividade::getAlvo).sum();
                if (soma != metaBase) {
                        throw new IllegalStateException(
                                        "Soma das sub_atividades (" + soma + ") não confere com a meta base ("
                                                        + metaBase + ")");
                }

                return subAtividades;
        }

        // @audit-ok [Deletar Hábito — soft delete: marca ativo=false sem remover dados históricos]
        @Transactional
        public void deletarHabito(final UUID habitoId) {
                if (habitoRepository.findById(habitoId).isEmpty()) {
                        throw new RuntimeException("Hábito não encontrado");
                }
                habitoRepository.archive(habitoId);
        }
}
