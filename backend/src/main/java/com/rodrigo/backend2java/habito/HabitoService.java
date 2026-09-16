package com.rodrigo.backend2java.habito;
import java.util.Set;
import java.util.UUID;
import java.util.List;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.time.ZonedDateTime;
import java.time.OffsetDateTime;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import com.rodrigo.backend2java.usuario.Usuario;
import com.rodrigo.backend2java.execucao.StatusHabito;
import com.rodrigo.backend2java.calibracao.CalibracaoService;
import org.springframework.transaction.annotation.Transactional;
import com.rodrigo.backend2java.execucao.StatusHabitoRepository;
import com.rodrigo.backend2java.execucao.HistoricoExecucaoRepository;
import com.rodrigo.backend2java.habito.HabitoRequestDTO.OcorrenciaRequestDTO;
import com.rodrigo.backend2java.infra.util.ZonaUsuario;
import com.rodrigo.backend2java.infra.exception.RecursoNaoEncontradoException;
import com.rodrigo.backend2java.infra.exception.RegraDeNegocioException;
import com.rodrigo.backend2java.infra.exception.ValidacaoException;
// @audit-ok [Dashboard (7) / Criar Hábito (16) — service de hábitos: CRUD e montagem do HabitoResponseDTO]
@Service
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

        /**
         * Todo hábito novo já nasce com alguns escudos, em vez de zero — dá pra
         * proteger a ofensiva desde os primeiros dias, quando o hábito ainda não
         * teve tempo de acumular moedas suficientes pra comprar um. Vale só para
         * hábitos criados a partir desta mudança; os que já existiam não ganham
         * escudos retroativos (decisão registrada no PLANO_REESTRUTURACAO.md, H.3).
         */
        private static final int ESCUDOS_INICIAIS = 3;

        // ck_sub_ordem do schema permite sub_ordem só entre 1 e 12.
        private static final int MAX_VEZES_AO_DIA = 12;

        // Horário padrão quando nenhum é informado.
        private static final LocalTime HORARIO_PADRAO = LocalTime.of(23, 59);

        private final HabitoRepository habitoRepository;
        private final StatusHabitoRepository statusHabitoRepository;
        private final SubAtividadeRepository subAtividadeRepository;
        private final ProximoVencimentoService proximoVencimentoService;
        private final AcessoHabitoService acessoHabitoService;
        private final CalibracaoService calibracaoService;
        private final HistoricoExecucaoRepository historicoExecucaoRepository;

        public HabitoService(HabitoRepository habitoRepository, StatusHabitoRepository statusHabitoRepository, SubAtividadeRepository subAtividadeRepository, ProximoVencimentoService proximoVencimentoService, AcessoHabitoService acessoHabitoService, CalibracaoService calibracaoService, HistoricoExecucaoRepository historicoExecucaoRepository) {
            this.habitoRepository = habitoRepository;
            this.statusHabitoRepository = statusHabitoRepository;
            this.subAtividadeRepository = subAtividadeRepository;
            this.proximoVencimentoService = proximoVencimentoService;
            this.acessoHabitoService = acessoHabitoService;
            this.calibracaoService = calibracaoService;
            this.historicoExecucaoRepository = historicoExecucaoRepository;
        }

        @Transactional
        public HabitoResponseDTO criarHabito(final String emailContexto, final HabitoRequestDTO request) {
                // @audit-ok [Criar Hábito (17) — busca usuário e valida limite de 2 hábitos ativos (RF03)]
                final var usuario = acessoHabitoService.usuarioPorEmail(emailContexto);

                final var habitosAtivos = habitoRepository.findAllByUsuarioIdAndAtivoTrue(usuario.getId());
                if (habitosAtivos.size() >= LIMITE_HABITOS_ATIVOS) {
                        throw new RegraDeNegocioException(
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
                                .metaBase(request.meta_base())
                                // @audit-ok [E2.3 — meta_maxima fica null quando omitido (é o valor
                                // válido de "sem teto"); incremento/dias_incremento recebem em Java
                                // o mesmo default que o schema aplicaria via DEFAULT, porque essas
                                // colunas entram explicitamente no INSERT e são NOT NULL.]
                                .metaMaxima(request.meta_maxima())
                                .incremento(request.incremento() != null ? request.incremento() : 0)
                                .diasIncremento(request.dias_incremento() != null ? request.dias_incremento() : 10)
                                // @audit-ok [E2.4 — omitido/branco vira '1111111' (todo dia), mesmo
                                // default do schema.]
                                .frequenciaSemanal(request.frequencia_semanal() != null
                                                && !request.frequencia_semanal().isBlank()
                                                                ? request.frequencia_semanal()
                                                                : "1111111")
                                .ativo(true)
                                .criadoEm(OffsetDateTime.now())
                                .build();

                habitoRepository.save(habito);

                // As sub_atividades vêm ANTES do status: proximo_vencimento precisa do
                // horário da ocorrência de sub_ordem = 1 já salvo. E todo hábito nasce
                // com pelo menos uma linha — a contagem delas É a frequência diária.
                final var subAtividades = gerarSubAtividades(habitoId, request.meta_base(),
                                request.meta_frequencia_diaria(), request.horario_agendado(), request.ocorrencias());
                subAtividades.forEach(subAtividadeRepository::save);

                // @audit-ok [Criar Hábito (19) — cria status inicial zerado vinculado ao novo hábito.
                // E2.1 (item 1) — proximo_vencimento já nasce apontando para a primeira
                // ocorrência, senão a expressão do avatar ficaria travada em "normal".]
                final var status = StatusHabito.builder()
                                .habitoId(habitoId)
                                .moedasLocais(0)
                                .bloqueiosAcumulados(ESCUDOS_INICIAIS)
                                .diasSeguidos(0)
                                .execucoesHoje(0)
                                .valorAcumuladoHoje(0)
                                .nivelAvatar(1)
                                .proximoVencimento(proximoVencimentoService.calcular(habito, usuario, Set.of()))
                                .bloqueioUsadoHoje(false)
                                .build();

                statusHabitoRepository.saveAndFlush(status);

                // RF20: o hábito nasceu de uma sugestão aceita — registra o vínculo para
                // dar para comparar, depois, o que foi sugerido com o que ficou de pé.
                if (request.calibracao_id() != null) {
                        calibracaoService.vincularAoHabito(request.calibracao_id(), usuario.getId(), habitoId);
                }

                // @audit-ok [Criar Hábito (20) — retorna hábito completo com status zerado]
                return montar(habito, status, subAtividades, Set.of(), ZonedDateTime.now(ZonaUsuario.resolver(usuario)));
        }

        /**
         * Dashboard do usuário. Três consultas fixas — hábitos, status e ocorrências —
         * em vez de duas por hábito: a view {@code vw_habito_hoje} escondia o N+1 em
         * {@code buscarDetalhadoPorId}, chamado dentro do laço.
         */
        // @audit-ok [Dashboard (8) — lista todos os hábitos ativos e agrega status para cada um]
        public List<HabitoResponseDTO> listarDashboard(final String emailContexto) {
                final var usuario = acessoHabitoService.usuarioPorEmail(emailContexto);
                final var habitos = habitoRepository.findAllByUsuarioIdAndAtivoTrue(usuario.getId());
                if (habitos.isEmpty()) {
                        return List.of();
                }

                final var ids = habitos.stream().map(Habito::getId).toList();
                final var statusPorHabito = statusHabitoRepository.findAllByHabitoIdIn(ids).stream()
                                .collect(Collectors.toMap(StatusHabito::getHabitoId, s -> s));
                final var ocorrenciasPorHabito = subAtividadeRepository
                                .findAllByHabitoIdInOrderByHabitoIdAscOrdemAsc(ids).stream()
                                .collect(Collectors.groupingBy(SubAtividade::getHabitoId));

                // Uma consulta só pra todos os hábitos (não uma por hábito): é o que
                // mantém o dashboard num número fixo de queries mesmo com o teto de
                // dois hábitos ativos (RF03) — ver HabitoDashboardQueryCountTest.
                final var hojeLocal = LocalDate.now(ZonaUsuario.resolver(usuario));
                final var agora = ZonedDateTime.now(ZonaUsuario.resolver(usuario));
                final var feitasHojePorHabito = historicoExecucaoRepository
                                .listarSubAtividadesFeitasHojeEmLote(ids, hojeLocal).stream()
                                .collect(Collectors.groupingBy(
                                                HistoricoExecucaoRepository.FeitoHojePorHabito::getHabitoId,
                                                Collectors.mapping(
                                                                HistoricoExecucaoRepository.FeitoHojePorHabito::getSubAtividadeId,
                                                                Collectors.toSet())));

                return habitos.stream()
                                .map(habito -> montar(habito,
                                                statusPorHabito.get(habito.getId()),
                                                ocorrenciasPorHabito.getOrDefault(habito.getId(), List.of()),
                                                feitasHojePorHabito.getOrDefault(habito.getId(), Set.of()),
                                                agora))
                                .collect(Collectors.toList());
        }

        public HabitoResponseDTO buscarDetalhadoPorId(final UUID habitoId, final String emailContexto) {
                final var acesso = acessoHabitoService.carregar(habitoId, emailContexto);
                final var habito = acesso.habito();
                final var hojeLocal = LocalDate.now(ZonaUsuario.resolver(acesso.dono()));
                final var feitasHojeIds = historicoExecucaoRepository
                                .agregarPorSubAtividadeNoDia(habitoId, hojeLocal).stream()
                                .map(HistoricoExecucaoRepository.AgregadoPorSubAtividade::getSubAtividadeId)
                                .filter(java.util.Objects::nonNull)
                                .collect(Collectors.toSet());
                return montar(habito, buscarStatus(habitoId),
                                subAtividadeRepository.findAllByHabitoIdOrderByOrdem(habitoId),
                                feitasHojeIds, ZonedDateTime.now(ZonaUsuario.resolver(acesso.dono())));
        }

        /**
         * Monta a resposta a partir das três peças que a compõem. É aqui que moram as
         * duas derivações que estavam na view: a frequência diária (contagem de
         * ocorrências) e o status do dia.
         */
        private HabitoResponseDTO montar(final Habito habito, final StatusHabito status,
                        final List<SubAtividade> subAtividades, final Set<UUID> feitasHojeIds,
                        final ZonedDateTime agora) {
                final var metaFrequenciaDiaria = Math.max(1, subAtividades.size());
                final var acumuladoHoje = status.getValorAcumuladoHoje() == null ? 0 : status.getValorAcumuladoHoje();
                final var metaBase = habito.getMetaBase() == null ? 0 : habito.getMetaBase();

                // RF07/RF13: o dia se fecha pelo total realizado, não pela contagem de
                // ocorrências. Bater a meta em duas das três agora conta como cumprida.
                final var status_hoje = metaBase > 0 && acumuladoHoje >= metaBase ? "COMPLETED" : "PENDING";

                // O status de cada ocorrência hoje (FEITO/FALHOU/ATIVA/PENDENTE) — a
                // "ocorrência atual" que os campos abaixo expõem é a ATIVA, ou a última
                // se nenhuma sobrou (todas já feitas ou falhas).
                final var statusPorOcorrencia = proximoVencimentoService.calcularStatusDeHoje(subAtividades,
                                feitasHojeIds, agora);
                final var ocorrenciaAtual = statusPorOcorrencia.stream()
                                .filter(o -> o.status() == ProximoVencimentoService.StatusOcorrenciaHoje.ATIVA)
                                .map(ProximoVencimentoService.OcorrenciaComStatus::subAtividade)
                                .findFirst()
                                .orElse(subAtividades.isEmpty() ? null : subAtividades.get(subAtividades.size() - 1));

                return HabitoResponseDTO.builder()
                                .id(habito.getId())
                                .titulo(habito.getTitulo())
                                .categoria(habito.getCategoria())
                                .tipo_medida(habito.getTipoMedida())
                                .meta_base(habito.getMetaBase())
                                .meta_frequencia_diaria(metaFrequenciaDiaria)
                                .ativo(habito.getAtivo())
                                .moedas_locais(status.getMoedasLocais())
                                .bloqueios_acumulados(status.getBloqueiosAcumulados())
                                .dias_seguidos(status.getDiasSeguidos())
                                .execucoes_hoje(status.getExecucoesHoje())
                                .valor_acumulado_hoje(acumuladoHoje)
                                .proximo_vencimento(status.getProximoVencimento())
                                .bloqueio_usado_hoje(status.getBloqueioUsadoHoje())
                                .status(status_hoje)
                                .meta_maxima(habito.getMetaMaxima())
                                .incremento(habito.getIncremento())
                                .dias_incremento(habito.getDiasIncremento())
                                .frequencia_semanal(habito.getFrequenciaSemanal())
                                .alvo_ocorrencia_atual(ocorrenciaAtual == null ? null : ocorrenciaAtual.getAlvo())
                                .horario_ocorrencia_atual(
                                                ocorrenciaAtual == null ? null : ocorrenciaAtual.getHorarioInicio())
                                .gatilho_ancora(habito.getGatilhoAncora())
                                .nivel_avatar(status.getNivelAvatar())
                                .ocorrencias(statusPorOcorrencia.stream()
                                                .map(o -> HabitoResponseDTO.OcorrenciaResponseDTO.builder()
                                                                .horario_inicio(o.subAtividade().getHorarioInicio())
                                                                .horario_fim(o.subAtividade().getHorarioFim())
                                                                .alvo(o.subAtividade().getAlvo())
                                                                .status(o.status().name())
                                                                .build())
                                                .toList())
                                .build();
        }

        private StatusHabito buscarStatus(final UUID habitoId) {
                return statusHabitoRepository.findById(habitoId)
                                .orElseThrow(() -> new RecursoNaoEncontradoException("Status do hábito não encontrado"));
        }

        @Transactional
        public void atualizarHabito(final UUID habitoId, final String emailContexto, final HabitoRequestDTO request) {
                final var acesso = acessoHabitoService.carregar(habitoId, emailContexto);
                final var habito = acesso.habito();

                // @audit-ok [E2.9 (item 4) — PUT é "substitua pelo que veio", não um PATCH
                // parcial: antes só título e meta_base eram considerados, e os outros
                // campos do request passavam por @Valid e eram descartados em silêncio.]
                habito.setTitulo(request.titulo());
                habito.setCategoria(request.categoria());
                habito.setGatilhoAncora(request.gatilho_ancora());
                habito.setTipoMedida(request.tipo_medida());
                habito.setMetaBase(request.meta_base());
                habito.setMetaMaxima(request.meta_maxima());
                habito.setIncremento(request.incremento() != null ? request.incremento() : 0);
                habito.setDiasIncremento(request.dias_incremento() != null ? request.dias_incremento() : 10);
                habito.setFrequenciaSemanal(request.frequencia_semanal() != null
                                && !request.frequencia_semanal().isBlank()
                                                ? request.frequencia_semanal()
                                                : "1111111");

                habitoRepository.save(habito);

                // Recalcula as sub_atividades: apaga e gera de novo a partir da meta e da
                // frequência atuais, para a soma dos sub_alvo nunca dessincronizar de
                // hab_meta_base. his_sub_atividade_id é ON DELETE SET NULL, então isto não
                // derruba histórico nenhum — só desvincula as execuções já registradas.
                subAtividadeRepository.deleteAllByHabitoId(habitoId);
                gerarSubAtividades(habitoId, request.meta_base(), request.meta_frequencia_diaria(),
                                request.horario_agendado(), request.ocorrencias())
                                .forEach(subAtividadeRepository::save);

                // @audit-ok [E2.1 — se o horário mudou, o proximo_vencimento calculado a
                // partir do horário anterior ficaria errado até a próxima virada de dia.
                // As sub_atividades acabaram de ser recriadas com IDs novos (linha 288),
                // então nenhum histórico de hoje pode apontar pra elas ainda — a 1ª
                // ocorrência nasce ATIVA mesmo que a pessoa já tivesse cumprido parte da
                // meta antes de editar. valor_acumulado_hoje/execucoes_hoje não são
                // tocados aqui, então o total do dia (o que decide streak, RF07/RF13)
                // continua correto — só a lista por ocorrência reinicia.]
                statusHabitoRepository.findById(habitoId).ifPresent(status -> {
                        status.setProximoVencimento(proximoVencimentoService.calcular(
                                        habito, acesso.dono(), Set.of()));
                        statusHabitoRepository.save(status);
                });
        }

        // @audit-ok [E0.5.5 — gera N sub_atividades repartindo metaBase igualmente
        // entre elas, jogando o resto na última. Pacote-privado (não private) de
        // propósito: HabitoServiceSubAtividadeTest testa isso direto, sem precisar
        // simular criarHabito inteiro.]
        List<SubAtividade> gerarSubAtividades(final UUID habitoId, final Integer metaBase,
                        final Integer vezesAoDiaRequisitado, final LocalTime horarioAgendado) {
                return gerarSubAtividades(habitoId, metaBase, vezesAoDiaRequisitado, horarioAgendado, null);
        }

        // E2.8 (item 1) — o parâmetro "ocorrencias": quando presente e do mesmo
        // tamanho de vezesAoDia, cada sub_atividade usa o horário da SUA própria
        // entrada (horários distintos por ocorrência); senão, cai num horário único
        // repetido em todas. O overload de 4 argumentos existe só pra não obrigar
        // todo chamador antigo a passar null explicitamente.
        List<SubAtividade> gerarSubAtividades(final UUID habitoId, final Integer metaBase,
                        final Integer vezesAoDiaRequisitado, final LocalTime horarioAgendado,
                        final List<OcorrenciaRequestDTO> ocorrencias) {
                final var vezesAoDia = vezesAoDiaRequisitado != null && vezesAoDiaRequisitado > 0
                                ? vezesAoDiaRequisitado
                                : 1;

                if (vezesAoDia > MAX_VEZES_AO_DIA) {
                        throw new ValidacaoException(
                                        "Frequência diária máxima é " + MAX_VEZES_AO_DIA + " vezes ao dia");
                }
                if (metaBase == null || metaBase < vezesAoDia) {
                        throw new ValidacaoException(
                                        "A meta base deve ser maior ou igual à frequência diária (" + vezesAoDia
                                                        + "x) para poder repartir a meta entre as ocorrências");
                }

                final var usaOcorrenciasIndividuais = ocorrencias != null && ocorrencias.size() == vezesAoDia;
                if (usaOcorrenciasIndividuais) {
                        for (final var ocorrencia : ocorrencias) {
                                if (ocorrencia.horario_inicio() == null) {
                                        throw new ValidacaoException(
                                                        "Informe o horário de início de cada ocorrência");
                                }
                        }
                } else if (vezesAoDia > 1 && horarioAgendado == null) {
                        // @audit-ok [E2.6 (item 6) — com mais de uma ocorrência compartilhando
                        // o mesmo horário, deixar em branco faria todas caírem em 23:59 sem o
                        // usuário ter escolhido isso.]
                        throw new ValidacaoException(
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

                // @audit-ok [Item 3 da E0.5.5 — assertiva de segurança contra regressão
                // futura no cálculo: com as guardas acima, a soma SEMPRE fecha com
                // metaBase por construção.]
                final var soma = subAtividades.stream().mapToInt(SubAtividade::getAlvo).sum();
                if (soma != metaBase) {
                        throw new IllegalStateException(
                                        "Soma das sub_atividades (" + soma + ") não confere com a meta base ("
                                                        + metaBase + ")");
                }

                return subAtividades;
        }

        // @audit-ok [Deletar Hábito — soft delete: marca ativo=false sem remover dados históricos (RF23)]
        @Transactional
        public void deletarHabito(final UUID habitoId, final String emailContexto) {
                acessoHabitoService.carregar(habitoId, emailContexto);
                habitoRepository.archive(habitoId);
        }
}
