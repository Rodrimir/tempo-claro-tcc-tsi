package com.rodrigo.backend2java.habito;
import java.time.Clock;
import java.time.LocalTime;
import java.util.HashSet;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.List;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.time.OffsetDateTime;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import com.rodrigo.backend2java.execucao.model.HistoricoExecucao;
import com.rodrigo.backend2java.execucao.model.StatusHabito;
import com.rodrigo.backend2java.calibracao.CalibracaoService;
import org.springframework.transaction.annotation.Transactional;
import com.rodrigo.backend2java.execucao.StatusHabitoRepository;
import com.rodrigo.backend2java.execucao.HistoricoExecucaoRepository;
import com.rodrigo.backend2java.habito.model.ConfigPendente;
import com.rodrigo.backend2java.habito.model.HabitoRequestDTO;
import com.rodrigo.backend2java.infra.util.ZonaUsuario;
import com.rodrigo.backend2java.infra.exception.RegraDeNegocioException;
import com.rodrigo.backend2java.infra.exception.ValidacaoException;
import com.rodrigo.backend2java.habito.model.Habito;
import com.rodrigo.backend2java.habito.model.SubAtividade;
import com.rodrigo.backend2java.habito.model.HabitoResponseDTO;
import com.rodrigo.backend2java.habito.model.FrequenciaSemanal;

@Service
public class HabitoService {

        public static final int LIMITE_HABITOS_ATIVOS = 2;

        private static final int ESCUDOS_INICIAIS = 3;

        private static final LocalTime HORARIO_PADRAO = LocalTime.of(23, 59);

        private static final Set<String> CATEGORIAS = Set.of("AGUA", "ESTUDO", "EXERCICIO");

        private final HabitoRepository habitoRepository;
        private final StatusHabitoRepository statusHabitoRepository;
        private final SubAtividadeRepository subAtividadeRepository;
        private final ProximoVencimentoService proximoVencimentoService;
        private final AcessoHabitoService acessoHabitoService;
        private final CalibracaoService calibracaoService;
        private final HistoricoExecucaoRepository historicoExecucaoRepository;
        private final GeradorDeOcorrencias geradorDeOcorrencias;
        private final ApuracaoService apuracaoService;
        private final ConfigPendenteRepository configPendenteRepository;
        private final Clock relogio;
        private final boolean regrasDoHorarioDoDia;

        public HabitoService(HabitoRepository habitoRepository, StatusHabitoRepository statusHabitoRepository,
                        SubAtividadeRepository subAtividadeRepository, ProximoVencimentoService proximoVencimentoService,
                        AcessoHabitoService acessoHabitoService, CalibracaoService calibracaoService,
                        HistoricoExecucaoRepository historicoExecucaoRepository, GeradorDeOcorrencias geradorDeOcorrencias,
                        ApuracaoService apuracaoService, ConfigPendenteRepository configPendenteRepository, Clock relogio,
                        @Value("${app.regras.horario-do-dia:true}") boolean regrasDoHorarioDoDia) {
            this.habitoRepository = habitoRepository;
            this.statusHabitoRepository = statusHabitoRepository;
            this.subAtividadeRepository = subAtividadeRepository;
            this.proximoVencimentoService = proximoVencimentoService;
            this.acessoHabitoService = acessoHabitoService;
            this.calibracaoService = calibracaoService;
            this.historicoExecucaoRepository = historicoExecucaoRepository;
            this.geradorDeOcorrencias = geradorDeOcorrencias;
            this.apuracaoService = apuracaoService;
            this.configPendenteRepository = configPendenteRepository;
            this.relogio = relogio;
            this.regrasDoHorarioDoDia = regrasDoHorarioDoDia;
        }

        @Transactional
        public HabitoResponseDTO criarHabito(final String emailContexto, final HabitoRequestDTO request) {
                final var usuario = acessoHabitoService.travarUsuarioPorEmail(emailContexto);

                final var habitosAtivos = habitoRepository.findAllByUsuarioIdAndAtivoTrue(usuario.getId());
                if (habitosAtivos.size() >= LIMITE_HABITOS_ATIVOS) {
                        throw new RegraDeNegocioException("habito.limiteAtivos", LIMITE_HABITOS_ATIVOS);
                }
                validarConfiguracao(request);

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
                                .incremento(incrementoDe(request))
                                .diasIncremento(diasIncrementoDe(request))
                                .frequenciaSemanal(frequenciaDe(request))
                                .ativo(true)
                                .criadoEm(OffsetDateTime.now())
                                .build();

                habitoRepository.save(habito);

                final var subAtividades = geradorDeOcorrencias.gerarSubAtividades(habitoId, request.meta_base(),
                                request.meta_frequencia_diaria(), request.horario_agendado(), request.ocorrencias());
                subAtividades.forEach(subAtividadeRepository::save);

                final var zona = ZonaUsuario.resolver(usuario);
                final var agora = ZonedDateTime.now(relogio.withZone(zona));
                final var dispensadas = dispensarOcorrenciasJaPassadas(habito, subAtividades, agora);
                final var alvoDispensado = subAtividades.stream()
                                .filter(sub -> dispensadas.contains(sub.getId()))
                                .mapToInt(SubAtividade::getAlvo)
                                .sum();

                final var status = StatusHabito.builder()
                                .habitoId(habitoId)
                                .moedasLocais(0)
                                .bloqueiosAcumulados(ESCUDOS_INICIAIS)
                                .diasSeguidos(0)
                                .execucoesHoje(0)
                                .valorAcumuladoHoje(0)
                                .moedasCreditadasHoje(0)
                                .alvoDispensadoHoje(alvoDispensado)
                                .nivelAvatar(1)
                                .proximoVencimento(proximoVencimentoService.calcular(habito, usuario, dispensadas))
                                .bloqueioUsadoHoje(false)
                                .ultimoReset(agora.toLocalDate().minusDays(1))
                                .build();

                statusHabitoRepository.saveAndFlush(status);

                if (request.calibracao_id() != null) {
                        calibracaoService.vincularAoHabito(request.calibracao_id(), usuario.getId(), habitoId,
                                        request.categoria());
                }

                return montar(habito, status, subAtividades, dispensadas, dispensadas, null,
                                ZonedDateTime.now(relogio.withZone(ZonaUsuario.resolver(usuario))));
        }

        // Criação depois do horário: as ocorrências de hoje cujo horário já passou (o fim, se houver,
        // senão o início) não ficam pendentes nem atrasadas. Cada uma vira uma linha DISPENSADO no
        // histórico, com valor e moedas zerados: conta como feita hoje, mas não rende moeda nem mexe
        // na ofensiva (FechamentoService trata o dia todo dispensado como neutro).
        private Set<UUID> dispensarOcorrenciasJaPassadas(final Habito habito, final List<SubAtividade> subAtividades,
                        final ZonedDateTime agora) {
                if (!regrasDoHorarioDoDia
                                || !FrequenciaSemanal.ehDiaProgramado(habito.getFrequenciaSemanal(), agora.toLocalDate())) {
                        return Set.of();
                }
                final var horaAgora = agora.toLocalTime();
                final var dispensadas = new HashSet<UUID>();
                for (final var sub : subAtividades) {
                        final var inicio = sub.getHorarioInicio() != null ? sub.getHorarioInicio() : HORARIO_PADRAO;
                        final var limite = sub.getHorarioFim() != null ? sub.getHorarioFim() : inicio;
                        if (limite.isBefore(horaAgora)) {
                                dispensadas.add(sub.getId());
                                historicoExecucaoRepository.save(HistoricoExecucao.builder()
                                                .id(UUID.randomUUID())
                                                .habitoId(habito.getId())
                                                .subAtividadeId(sub.getId())
                                                .executionToken(UUID.randomUUID())
                                                .dataHoraExecucao(agora.toOffsetDateTime())
                                                .dataLocal(agora.toLocalDate())
                                                .valorRealizado(0)
                                                .moedasGanhas(0)
                                                .tipoSucesso("DISPENSADO")
                                                .build());
                        }
                }
                return dispensadas;
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
                final var pendenciaPorHabito = configPendenteRepository.findAllByHabitoIdIn(ids).stream()
                                .collect(Collectors.toMap(ConfigPendente::getHabitoId, p -> p));

                final var hojeLocal = LocalDate.now(ZonaUsuario.resolver(usuario));
                final var aApurar = statusPorHabito.values().stream()
                                .filter(status -> ApuracaoService.temDiaPendente(status, usuario)
                                                || pendenciaVigente(pendenciaPorHabito.get(status.getHabitoId()), hojeLocal))
                                .map(StatusHabito::getHabitoId)
                                .toList();
                if (!aApurar.isEmpty()) {
                        aApurar.forEach(habitoId -> apuracaoService.apurarAteHoje(habitoId, usuario));
                        return listarDashboard(emailContexto);
                }
                final var ocorrenciasPorHabito = subAtividadeRepository
                                .findAllByHabitoIdInOrderByHabitoIdAscOrdemAsc(ids).stream()
                                .collect(Collectors.groupingBy(SubAtividade::getHabitoId));

                final var agora = ZonedDateTime.now(relogio.withZone(ZonaUsuario.resolver(usuario)));
                final var feitasHoje = historicoExecucaoRepository.listarSubAtividadesFeitasHojeEmLote(ids, hojeLocal);
                final Map<UUID, Set<UUID>> feitasHojePorHabito = feitasHoje.stream()
                                .collect(Collectors.groupingBy(
                                                HistoricoExecucaoRepository.FeitoHojePorHabito::getHabitoId,
                                                Collectors.mapping(
                                                                HistoricoExecucaoRepository.FeitoHojePorHabito::getSubAtividadeId,
                                                                Collectors.toSet())));
                final Map<UUID, Set<UUID>> dispensadasPorHabito = feitasHoje.stream()
                                .filter(feito -> "DISPENSADO".equals(feito.getTipo()))
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
                                                dispensadasPorHabito.getOrDefault(habito.getId(), Set.of()),
                                                pendenciaPorHabito.get(habito.getId()),
                                                agora))
                                .collect(Collectors.toList());
        }

        private static boolean pendenciaVigente(final ConfigPendente pendente, final LocalDate hoje) {
                return pendente != null && !hoje.isBefore(pendente.getVigenteEm());
        }

        private HabitoResponseDTO montar(final Habito habito, final StatusHabito status,
                        final List<SubAtividade> subAtividades, final Set<UUID> feitasHojeIds,
                        final Set<UUID> dispensadasIds, final ConfigPendente pendente, final ZonedDateTime agora) {
                final var metaFrequenciaDiaria = Math.max(1, subAtividades.size());
                final var acumuladoHoje = status.getValorAcumuladoHoje() == null ? 0 : status.getValorAcumuladoHoje();
                final var metaBase = habito.getMetaBase() == null ? 0 : habito.getMetaBase();
                final var alvoDispensado = status.getAlvoDispensadoHoje() == null ? 0 : status.getAlvoDispensadoHoje();
                final var metaDeHoje = metaBase - alvoDispensado;

                final var status_hoje = metaBase > 0 && (metaDeHoje <= 0 || acumuladoHoje >= metaDeHoje)
                                ? "COMPLETED"
                                : "PENDING";

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
                                                                .dispensada(dispensadasIds.contains(o.subAtividade().getId()))
                                                                .build())
                                                .toList())
                                .alteracao_pendente(pendente == null ? null : alteracaoPendente(pendente))
                                .build();
        }

        private static HabitoResponseDTO.AlteracaoPendenteDTO alteracaoPendente(final ConfigPendente pendente) {
                return HabitoResponseDTO.AlteracaoPendenteDTO.builder()
                                .vigente_em(pendente.getVigenteEm())
                                .categoria(pendente.getCategoria())
                                .tipo_medida(pendente.getTipoMedida())
                                .meta_base(pendente.getMetaBase())
                                .meta_maxima(pendente.getMetaMaxima())
                                .incremento(pendente.getIncremento())
                                .dias_incremento(pendente.getDiasIncremento())
                                .frequencia_semanal(pendente.getFrequenciaSemanal())
                                .meta_frequencia_diaria(pendente.getVezesAoDia())
                                .horario_agendado(pendente.getHorarioAgendado())
                                .ocorrencias(pendente.ocorrenciasDecodificadas())
                                .build();
        }

        // Edição: título e gatilho-âncora mudam na hora. O resto da configuração (meta, progressão,
        // teto, dias da semana, vezes ao dia e horários) fica pendente e só vale a partir de amanhã no
        // fuso do usuário, para que o dia em andamento seja apurado inteiro com a configuração com que
        // começou. Tudo é validado agora; uma nova edição substitui a pendente, e voltar à
        // configuração em vigor cancela a pendência.
        @Transactional
        public void atualizarHabito(final UUID habitoId, final String emailContexto, final HabitoRequestDTO request) {
                final var acesso = acessoHabitoService.carregar(habitoId, emailContexto);
                final var habito = acesso.habito();
                validarConfiguracao(request);

                habito.setTitulo(request.titulo());
                habito.setGatilhoAncora(request.gatilho_ancora());
                habitoRepository.save(habito);

                final var subAtividadesAtuais = subAtividadeRepository.findAllByHabitoIdOrderByOrdem(habitoId);
                if (mesmaConfiguracao(habito, subAtividadesAtuais, request)) {
                        configPendenteRepository.findById(habitoId).ifPresent(configPendenteRepository::delete);
                        return;
                }

                final var amanha = LocalDate.now(ZonaUsuario.resolver(acesso.dono())).plusDays(1);
                configPendenteRepository.save(ConfigPendente.builder()
                                .habitoId(habitoId)
                                .categoria(request.categoria())
                                .tipoMedida(request.tipo_medida())
                                .metaBase(request.meta_base())
                                .metaMaxima(request.meta_maxima())
                                .incremento(incrementoDe(request))
                                .diasIncremento(diasIncrementoDe(request))
                                .frequenciaSemanal(frequenciaDe(request))
                                .vezesAoDia(vezesDe(request))
                                .horarioAgendado(request.horario_agendado())
                                .ocorrencias(ConfigPendente.codificar(request.ocorrencias()))
                                .vigenteEm(amanha)
                                .criadoEm(OffsetDateTime.now())
                                .build());
        }

        @Transactional
        public void deletarHabito(final UUID habitoId, final String emailContexto) {
                acessoHabitoService.carregar(habitoId, emailContexto);
                habitoRepository.excluir(habitoId);
        }

        // Validações que o banco também faria, feitas antes para que uma edição adiada não seja aceita
        // agora e recusada só amanhã.
        private void validarConfiguracao(final HabitoRequestDTO request) {
                if (request.categoria() == null || !CATEGORIAS.contains(request.categoria())) {
                        throw new ValidacaoException("habito.categoriaInvalida", String.valueOf(request.categoria()));
                }
                final var tipoEsperado = "AGUA".equals(request.categoria()) ? "QUANTIDADE" : "TEMPO";
                if (!tipoEsperado.equals(request.tipo_medida())) {
                        throw new ValidacaoException("habito.tipoMedidaDivergente", request.tipo_medida(),
                                        request.categoria());
                }
                if (request.meta_maxima() != null && request.meta_base() != null
                                && request.meta_maxima() < request.meta_base()) {
                        throw new ValidacaoException("habito.tetoMenorQueMeta");
                }
                if (frequenciaDe(request).indexOf('1') < 0) {
                        throw new ValidacaoException("habito.semDiaMarcado");
                }
                if (request.ocorrencias() != null) {
                        for (final var ocorrencia : request.ocorrencias()) {
                                if (ocorrencia.horario_inicio() != null && ocorrencia.horario_fim() != null
                                                && ocorrencia.horario_fim().isBefore(ocorrencia.horario_inicio())) {
                                        throw new ValidacaoException("habito.fimAntesDoInicio");
                                }
                        }
                }
                geradorDeOcorrencias.gerarSubAtividades(UUID.randomUUID(), request.meta_base(),
                                request.meta_frequencia_diaria(), request.horario_agendado(), request.ocorrencias());
        }

        private boolean mesmaConfiguracao(final Habito habito, final List<SubAtividade> atuais,
                        final HabitoRequestDTO request) {
                if (!Objects.equals(habito.getCategoria(), request.categoria())
                                || !Objects.equals(habito.getTipoMedida(), request.tipo_medida())
                                || !Objects.equals(habito.getMetaBase(), request.meta_base())
                                || !Objects.equals(habito.getMetaMaxima(), request.meta_maxima())
                                || !Objects.equals(habito.getIncremento(), incrementoDe(request))
                                || !Objects.equals(habito.getDiasIncremento(), diasIncrementoDe(request))
                                || !Objects.equals(habito.getFrequenciaSemanal(), frequenciaDe(request))
                                || atuais.size() != vezesDe(request)) {
                        return false;
                }
                final var novas = geradorDeOcorrencias.gerarSubAtividades(habito.getId(), request.meta_base(),
                                request.meta_frequencia_diaria(), request.horario_agendado(), request.ocorrencias());
                for (var i = 0; i < atuais.size(); i++) {
                        if (!Objects.equals(atuais.get(i).getHorarioInicio(), novas.get(i).getHorarioInicio())
                                        || !Objects.equals(atuais.get(i).getHorarioFim(), novas.get(i).getHorarioFim())) {
                                return false;
                        }
                }
                return true;
        }

        private static int incrementoDe(final HabitoRequestDTO request) {
                return request.incremento() != null ? request.incremento() : 0;
        }

        private static int diasIncrementoDe(final HabitoRequestDTO request) {
                return request.dias_incremento() != null ? request.dias_incremento() : 10;
        }

        private static int vezesDe(final HabitoRequestDTO request) {
                return request.meta_frequencia_diaria() != null && request.meta_frequencia_diaria() > 0
                                ? request.meta_frequencia_diaria()
                                : 1;
        }

        private static String frequenciaDe(final HabitoRequestDTO request) {
                return request.frequencia_semanal() != null && !request.frequencia_semanal().isBlank()
                                ? request.frequencia_semanal()
                                : FrequenciaSemanal.TODO_DIA;
        }
}
