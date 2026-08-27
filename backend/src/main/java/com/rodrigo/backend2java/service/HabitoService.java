package com.rodrigo.backend2java.service;
import java.util.UUID;
import java.util.List;
import java.time.OffsetDateTime;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import com.rodrigo.backend2java.model.Habito;
import org.springframework.stereotype.Service;
import com.rodrigo.backend2java.model.StatusHabito;
import com.rodrigo.backend2java.repository.HabitoRepository;
import com.rodrigo.backend2java.repository.UsuarioRepository;
import org.springframework.transaction.annotation.Transactional;
import com.rodrigo.backend2java.repository.StatusHabitoRepository;
import com.rodrigo.backend2java.model.dto.request.HabitoRequestDTO;
import com.rodrigo.backend2java.model.dto.response.HabitoResponseDTO;
// @audit-ok [Dashboard (7) / Criar Hábito (16) — service de hábitos: CRUD e montagem do HabitoResponseDTO]
@Service
@RequiredArgsConstructor
public class HabitoService {

        /**
         * RF03 — o usuário pode manter no máximo 2 hábitos ativos simultâneos.
         * O foco isolado (RNF02) é a premissa do app: mais de dois hábitos em
         * paralelo recria a lista de tarefas que o Tempo Claro existe para evitar.
         */
        private static final int LIMITE_HABITOS_ATIVOS = 2;

        private final HabitoRepository habitoRepository;
        private final StatusHabitoRepository statusHabitoRepository;
        private final UsuarioRepository usuarioRepository;

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
                                .intervaloMinutos(request.intervalo_minutos())
                                .ativo(true)
                                .criadoEm(OffsetDateTime.now())
                                .build();

                habitoRepository.save(habito);

                // @audit-ok [Criar Hábito (19) — cria status inicial zerado vinculado ao novo hábito]
                final var status = StatusHabito.builder()
                                .habitoId(habitoId)
                                .moedasLocais(0)
                                .bloqueiosAcumulados(0)
                                .diasSeguidos(0)
                                .execucoesHoje(0)
                                .proximoVencimento(null)
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

        // @audit-ok [Dashboard (9) — JOIN lógico entre habitos e status_habitos para montar HabitoResponseDTO]
        public HabitoResponseDTO buscarDetalhadoPorId(final UUID habitoId) {
                final var habito = habitoRepository.findById(habitoId)
                                .orElseThrow(() -> new RuntimeException("Hábito não encontrado"));

                final var status = statusHabitoRepository.findById(habitoId)
                                .orElseThrow(() -> new RuntimeException("Status do Hábito não encontrado"));

                return HabitoResponseDTO.builder()
                                .id(habito.getId())
                                .titulo(habito.getTitulo())
                                .categoria(habito.getCategoria())
                                .tipo_medida(habito.getTipoMedida())
                                .modalidade(habito.getModalidade())
                                .horario_agendado(habito.getHorarioAgendado())
                                .meta_base(habito.getMetaBase())
                                .meta_frequencia_diaria(habito.getMetaFrequenciaDiaria())
                                .intervalo_minutos(habito.getIntervaloMinutos())
                                .ativo(habito.getAtivo())
                                .moedas_locais(status.getMoedasLocais())
                                .bloqueios_acumulados(status.getBloqueiosAcumulados())
                                .dias_seguidos(status.getDiasSeguidos())
                                .execucoes_hoje(status.getExecucoesHoje())
                                .proximo_vencimento(status.getProximoVencimento())
                                .bloqueio_usado_hoje(status.getBloqueioUsadoHoje())
                                .build();
        }

        @Transactional
        public void atualizarHabito(final UUID habitoId, final HabitoRequestDTO request) {
                final var habito = habitoRepository.findById(habitoId)
                                .orElseThrow(() -> new RuntimeException("Hábito não encontrado"));

                habito.setTitulo(request.titulo());
                habito.setMetaBase(request.meta_base());

                habitoRepository.update(habito);
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
