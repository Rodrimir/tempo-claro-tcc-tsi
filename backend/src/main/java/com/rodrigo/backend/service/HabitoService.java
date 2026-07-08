package com.rodrigo.backend.service;

import java.util.List;
import java.util.UUID;
import java.time.ZoneId;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import com.rodrigo.backend.model.Habito;
import org.springframework.stereotype.Service;
import com.rodrigo.backend.model.SubAtividade;
import com.rodrigo.backend.model.AvatarCatalogo;
import com.rodrigo.backend.model.dto.SubAtividadeDTO;
import com.rodrigo.backend.repository.HabitoRepository;
import com.rodrigo.backend.repository.UsuarioRepository;
import com.rodrigo.backend.exception.RegraNegocioException;
import org.springframework.transaction.annotation.Transactional;
import com.rodrigo.backend.repository.SubAtividadeRepository;
import com.rodrigo.backend.model.dto.request.HabitoRequestDTO;
import com.rodrigo.backend.repository.AvatarCatalogoRepository;
import com.rodrigo.backend.repository.RegistroDiarioRepository;
import com.rodrigo.backend.model.dto.response.HabitoResponseDTO;
import com.rodrigo.backend.repository.CategoriaHabitoRepository;
import com.rodrigo.backend.repository.HabitoDiaSemanaRepository;
import com.rodrigo.backend.repository.TransacaoMoedasRepository;
import com.rodrigo.backend.repository.HistoricoExecucaoRepository;
import com.rodrigo.backend.exception.RecursoNaoEncontradoException;

// @audit-ok [Dashboard(2) / Criar Hábito(2) — service de hábitos: CRUD com sub-atividades, dias da semana e categoria resolvida]

@Service
@RequiredArgsConstructor
public class HabitoService {

        private final HabitoRepository habitoRepository;
        private final UsuarioRepository usuarioRepository;
        private final CategoriaHabitoRepository categoriaHabitoRepository;
        private final SubAtividadeRepository subAtividadeRepository;
        private final HabitoDiaSemanaRepository habitoDiaSemanaRepository;
        private final TransacaoMoedasRepository transacaoMoedasRepository;
        private final RegistroDiarioRepository registroDiarioRepository;
        private final HistoricoExecucaoRepository historicoExecucaoRepository;
        private final AvatarCatalogoRepository avatarCatalogoRepository;

        @Transactional
        public HabitoResponseDTO criarHabito(final String emailContexto, final HabitoRequestDTO request) {
                // @audit-info [Criar Hábito(2) — busca usuário pelo email do contexto JWT]
                final var usuario = usuarioRepository.findByEmail(emailContexto)
                                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário não encontrado"));

                // @audit-info [Criar Hábito(2) — valida que o molde existe no catálogo fixo (regra 3.1)]
                final var categoria = categoriaHabitoRepository.findByCodigo(request.categoria_codigo())
                                .orElseThrow(() -> new RegraNegocioException(
                                                "Categoria inválida: " + request.categoria_codigo()
                                                                + ". Use AGUA, ESTUDO ou EXERCICIO"));

                // @audit-info [Criar Hábito(2) — valida limite de 2 hábitos ativos por usuário (regra 3.2)]
                final long habitosAtivos = habitoRepository.findAllByUsuarioId(usuario.getId()).size();
                if (habitosAtivos >= 2) {
                        throw new RegraNegocioException("Limite de 2 hábitos ativos atingido");
                }

                final var habitoId = UUID.randomUUID();

                // @audit-info [Criar Hábito(2) — monta entidade Habito com os campos do novo schema]
                final var habito = Habito.builder()
                                .id(habitoId)
                                .usuarioId(usuario.getId())
                                .categoriaId(categoria.getId())
                                .titulo(request.titulo())
                                .gatilhoAncora(request.gatilho_ancora())
                                .horarioAgendado(request.horario_agendado())
                                .tipoMedida(request.tipo_medida())
                                .metaBase(request.meta_base())
                                .metaMaxima(request.meta_maxima())
                                .diasParaAumento(request.dias_para_aumento())
                                .incrementoMeta(request.incremento_meta())
                                .ativo(true)
                                .criadoEm(OffsetDateTime.now())
                                .build();

                habitoRepository.save(habito);

                // @audit-info [Criar Hábito(2) — persiste sub-atividades se fornecidas (regra 3.4)]
                salvarSubAtividades(habitoId, request.sub_atividades());

                // @audit-info [Criar Hábito(2) — persiste frequência semanal se fornecida (F02)]
                salvarDiasSemana(habitoId, request.dias_semana());

                return buscarDetalhadoPorId(habitoId);
        }

        // @audit-ok [Dashboard(2) — lista todos os hábitos ativos e monta HabitoResponseDTO para cada um]
        public List<HabitoResponseDTO> listarDashboard(final String emailContexto) {
                final var usuario = usuarioRepository.findByEmail(emailContexto)
                                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário não encontrado"));

                return habitoRepository.findAllByUsuarioId(usuario.getId()).stream()
                                .map(this::montarResponse)
                                .collect(Collectors.toList());
        }

        // @audit-ok [Dashboard(2) — busca o hábito por id e delega a montagem do DTO]
        public HabitoResponseDTO buscarDetalhadoPorId(final UUID habitoId) {
                final var habito = habitoRepository.findById(habitoId)
                                .orElseThrow(() -> new RecursoNaoEncontradoException("Hábito não encontrado"));
                return montarResponse(habito);
        }

        // @audit-ok [Dashboard(2) — monta o HabitoResponseDTO a partir de um Habito já carregado (evita re-leitura no dashboard)]
        public HabitoResponseDTO montarResponse(final Habito habito) {
                final var habitoId = habito.getId();

                // @audit-info [Dashboard(2) — resolve dados da categoria para compor o DTO de resposta]
                final var categoria = categoriaHabitoRepository.findById(habito.getCategoriaId())
                                .orElseThrow(() -> new RecursoNaoEncontradoException("Categoria do hábito não encontrada"));

                // @audit-info [Dashboard(2) — carrega sub-atividades do hábito em ordem]
                final var subAtividades = subAtividadeRepository.findByHabitoId(habitoId).stream()
                                .map(sa -> SubAtividadeDTO.builder()
                                                .id(sa.getId())
                                                .ordem(sa.getOrdem())
                                                .alvo_parcial(sa.getAlvoParcial())
                                                .horario_inicio(sa.getHorarioInicio())
                                                .horario_fim(sa.getHorarioFim())
                                                .build())
                                .collect(Collectors.toList());

                // @audit-info [Dashboard(2) — carrega dias da semana configurados para o hábito]
                final var diasSemana = habitoDiaSemanaRepository.findByHabitoId(habitoId);

                // @audit-info [Dashboard(2) — calcula a ofensiva pela regra central (respeita escudo e o dia corrente em andamento)]
                final var usuario = usuarioRepository.findById(habito.getUsuarioId())
                                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário não encontrado"));
                final var registros = registroDiarioRepository.findAllByHabitoId(habitoId);
                final var hoje = LocalDate.now(ZoneId.of(usuario.getFusoHorario()));
                final int ofensiva = OfensivaCalculator.calcular(registros, hoje);

                // @audit-info [Dashboard(2) — escudos disponíveis = escudos comprados − escudos usados em FAIL_BLOQUEIO]
                final int saldo = transacaoMoedasRepository.findSaldoByHabitoId(habitoId);
                final int escudosBrutos = transacaoMoedasRepository.countByTipoAndHabitoId(habitoId, "DEBITO_ESCUDO");
                final int escudosUsados = historicoExecucaoRepository.countByTipoSucessoAndHabitoId(habitoId, "FAIL_BLOQUEIO");
                final int escudosDisponiveis = Math.max(0, escudosBrutos - escudosUsados);

                // @audit-info [Dashboard(2) — avatar: tier mais alto com streak_minimo <= ofensiva, estado NORMAL]
                final var avatarUrl = avatarCatalogoRepository
                                .findByCategoriaAndStreak(habito.getCategoriaId(), "NORMAL", ofensiva)
                                .map(AvatarCatalogo::getAssetVisualUrl)
                                .orElse(null);

                return HabitoResponseDTO.builder()
                                .id(habito.getId())
                                .categoriaId(habito.getCategoriaId())
                                .categoriaCodigo(categoria.getCodigo())
                                .categoriaNome(categoria.getNome())
                                .titulo(habito.getTitulo())
                                .gatilhoAncora(habito.getGatilhoAncora())
                                .tipo_medida(habito.getTipoMedida())
                                .horario_agendado(habito.getHorarioAgendado())
                                .meta_base(habito.getMetaBase())
                                .meta_maxima(habito.getMetaMaxima())
                                .dias_para_aumento(habito.getDiasParaAumento())
                                .incremento_meta(habito.getIncrementoMeta())
                                .ativo(habito.getAtivo())
                                .arquivadoEm(habito.getArquivadoEm())
                                .sub_atividades(subAtividades)
                                .dias_semana(diasSemana)
                                .saldo(saldo)
                                .escudosDisponiveis(escudosDisponiveis)
                                .ofensiva(ofensiva)
                                .nivel((ofensiva / 10) * 10)
                                .avatarUrl(avatarUrl)
                                .build();
        }

        @Transactional
        public void atualizarHabito(final UUID habitoId, final HabitoRequestDTO request) {
                final var habito = habitoRepository.findById(habitoId)
                                .orElseThrow(() -> new RecursoNaoEncontradoException("Hábito não encontrado"));

                habito.setTitulo(request.titulo());
                habito.setMetaBase(request.meta_base());
                if (request.meta_maxima() != null)       habito.setMetaMaxima(request.meta_maxima());
                if (request.dias_para_aumento() != null) habito.setDiasParaAumento(request.dias_para_aumento());
                if (request.incremento_meta() != null)   habito.setIncrementoMeta(request.incremento_meta());
                if (request.horario_agendado() != null)  habito.setHorarioAgendado(request.horario_agendado());
                if (request.gatilho_ancora() != null)    habito.setGatilhoAncora(request.gatilho_ancora());

                habitoRepository.update(habito);

                // @audit-info [Atualizar Hábito(2) — substitui sub-atividades se enviadas (delete + re-insert)]
                if (request.sub_atividades() != null) {
                        subAtividadeRepository.deleteByHabitoId(habitoId);
                        salvarSubAtividades(habitoId, request.sub_atividades());
                }

                // @audit-info [Atualizar Hábito(2) — substitui dias da semana se enviados (delete + re-insert)]
                if (request.dias_semana() != null) {
                        habitoDiaSemanaRepository.deleteByHabitoId(habitoId);
                        salvarDiasSemana(habitoId, request.dias_semana());
                }
        }

        // @audit-ok [Deletar Hábito(2) — soft delete: arquiva o hábito sem remover histórico (RF23)]
        @Transactional
        public void deletarHabito(final UUID habitoId) {
                if (habitoRepository.findById(habitoId).isEmpty()) {
                        throw new RecursoNaoEncontradoException("Hábito não encontrado");
                }
                habitoRepository.archive(habitoId);
        }

        private void salvarSubAtividades(UUID habitoId, List<SubAtividadeDTO> dtos) {
                if (dtos == null || dtos.isEmpty()) return;
                for (int i = 0; i < dtos.size(); i++) {
                        final var dto = dtos.get(i);
                        subAtividadeRepository.save(SubAtividade.builder()
                                        .id(UUID.randomUUID())
                                        .habitoId(habitoId)
                                        .ordem(dto.ordem() != null ? dto.ordem() : i + 1)
                                        .alvoParcial(dto.alvo_parcial())
                                        .horarioInicio(dto.horario_inicio())
                                        .horarioFim(dto.horario_fim())
                                        .build());
                }
        }

        private void salvarDiasSemana(UUID habitoId, List<Integer> dias) {
                if (dias == null || dias.isEmpty()) return;
                final var diasValidos = dias.stream()
                                .filter(d -> d >= 0 && d <= 6)
                                .distinct()
                                .collect(Collectors.toList());
                habitoDiaSemanaRepository.saveAll(habitoId, diasValidos);
        }
}
