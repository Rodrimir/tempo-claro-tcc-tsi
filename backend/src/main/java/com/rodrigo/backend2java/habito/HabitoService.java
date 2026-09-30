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
@Service
public class HabitoService {

        public static final int LIMITE_HABITOS_ATIVOS = 2;

        private static final int ESCUDOS_INICIAIS = 3;

        private static final int MAX_VEZES_AO_DIA = 12;

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
                final var usuario = acessoHabitoService.usuarioPorEmail(emailContexto);

                final var habitosAtivos = habitoRepository.findAllByUsuarioIdAndAtivoTrue(usuario.getId());
                if (habitosAtivos.size() >= LIMITE_HABITOS_ATIVOS) {
                        throw new RegraDeNegocioException(
                                        "Limite de " + LIMITE_HABITOS_ATIVOS + " hábitos ativos atingido");
                }

                final var habitoId = UUID.randomUUID();

                final var habito = Habito.builder()
                                .id(habitoId)
                                .usuarioId(usuario.getId())
                                .titulo(request.titulo())
                                .categoria(request.categoria())
                                .gatilhoAncora(request.gatilho_ancora())
                                .tipoMedida(request.tipo_medida())
                                .metaBase(request.meta_base())
                                .metaMaxima(request.meta_maxima())
                                .incremento(request.incremento() != null ? request.incremento() : 0)
                                .diasIncremento(request.dias_incremento() != null ? request.dias_incremento() : 10)
                                .frequenciaSemanal(request.frequencia_semanal() != null
                                                && !request.frequencia_semanal().isBlank()
                                                                ? request.frequencia_semanal()
                                                                : "1111111")
                                .ativo(true)
                                .criadoEm(OffsetDateTime.now())
                                .build();

                habitoRepository.save(habito);

                final var subAtividades = gerarSubAtividades(habitoId, request.meta_base(),
                                request.meta_frequencia_diaria(), request.horario_agendado(), request.ocorrencias());
                subAtividades.forEach(subAtividadeRepository::save);

                final var status = StatusHabito.builder()
                                .habitoId(habitoId)
                                .moedasLocais(0)
                                .bloqueiosAcumulados(ESCUDOS_INICIAIS)
                                .diasSeguidos(0)
                                .execucoesHoje(0)
                                .valorAcumuladoHoje(0)
                                .moedasCreditadasHoje(0)
                                .nivelAvatar(1)
                                .proximoVencimento(proximoVencimentoService.calcular(habito, usuario, Set.of()))
                                .bloqueioUsadoHoje(false)
                                .build();

                statusHabitoRepository.saveAndFlush(status);

                if (request.calibracao_id() != null) {
                        calibracaoService.vincularAoHabito(request.calibracao_id(), usuario.getId(), habitoId);
                }

                return montar(habito, status, subAtividades, Set.of(), ZonedDateTime.now(ZonaUsuario.resolver(usuario)));
        }

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

        private HabitoResponseDTO montar(final Habito habito, final StatusHabito status,
                        final List<SubAtividade> subAtividades, final Set<UUID> feitasHojeIds,
                        final ZonedDateTime agora) {
                final var metaFrequenciaDiaria = Math.max(1, subAtividades.size());
                final var acumuladoHoje = status.getValorAcumuladoHoje() == null ? 0 : status.getValorAcumuladoHoje();
                final var metaBase = habito.getMetaBase() == null ? 0 : habito.getMetaBase();

                final var status_hoje = metaBase > 0 && acumuladoHoje >= metaBase ? "COMPLETED" : "PENDING";

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

                subAtividadeRepository.deleteAllByHabitoId(habitoId);
                gerarSubAtividades(habitoId, request.meta_base(), request.meta_frequencia_diaria(),
                                request.horario_agendado(), request.ocorrencias())
                                .forEach(subAtividadeRepository::save);

                statusHabitoRepository.findById(habitoId).ifPresent(status -> {
                        status.setProximoVencimento(proximoVencimentoService.calcular(
                                        habito, acesso.dono(), Set.of()));
                        statusHabitoRepository.save(status);
                });
        }

        List<SubAtividade> gerarSubAtividades(final UUID habitoId, final Integer metaBase,
                        final Integer vezesAoDiaRequisitado, final LocalTime horarioAgendado) {
                return gerarSubAtividades(habitoId, metaBase, vezesAoDiaRequisitado, horarioAgendado, null);
        }

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

                final var soma = subAtividades.stream().mapToInt(SubAtividade::getAlvo).sum();
                if (soma != metaBase) {
                        throw new IllegalStateException(
                                        "Soma das sub_atividades (" + soma + ") não confere com a meta base ("
                                                        + metaBase + ")");
                }

                return subAtividades;
        }

        @Transactional
        public void deletarHabito(final UUID habitoId, final String emailContexto) {
                acessoHabitoService.carregar(habitoId, emailContexto);
                habitoRepository.archive(habitoId);
        }
}
