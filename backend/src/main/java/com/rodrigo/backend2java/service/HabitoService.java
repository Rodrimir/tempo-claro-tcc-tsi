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

        // ck_sub_ordem do schema v2.1 permite sub_ordem só entre 1 e 12.
        private static final int MAX_VEZES_AO_DIA = 12;

        // Horário padrão quando nenhum é informado (item 1 da E0.5.5).
        private static final LocalTime HORARIO_PADRAO = LocalTime.of(23, 59);

        private final HabitoRepository habitoRepository;
        private final StatusHabitoRepository statusHabitoRepository;
        private final UsuarioRepository usuarioRepository;
        private final SubAtividadeRepository subAtividadeRepository;
        private final HabitoHojeRepository habitoHojeRepository;

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

                // @audit-ok [E0.5.5 — gera as sub_atividades do hábito. No schema v2.1 não
                // existe mais a coluna meta_frequencia_diaria: a CONTAGEM de linhas em
                // sub_atividades é a meta de frequência diária (vw_habito_hoje). Um hábito
                // sem sub_atividade fica invisível para essa view — por isso todo hábito
                // criado sai daqui com pelo menos 1 linha.]
                gerarSubAtividades(habitoId, request.meta_base(), request.meta_frequencia_diaria(),
                                request.horario_agendado())
                                .forEach(subAtividadeRepository::save);

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
                return habitoHojeRepository.findByHabitoId(habitoId)
                                .orElseThrow(() -> new RuntimeException("Hábito não encontrado"));
        }

        @Transactional
        public void atualizarHabito(final UUID habitoId, final HabitoRequestDTO request) {
                final var habito = habitoRepository.findById(habitoId)
                                .orElseThrow(() -> new RuntimeException("Hábito não encontrado"));

                habito.setTitulo(request.titulo());
                habito.setMetaBase(request.meta_base());

                habitoRepository.update(habito);

                // @audit-ok [E0.5.5 (item 4) — recalcula as sub_atividades: apaga as
                // antigas e gera de novo a partir da meta_base/frequência atuais, para a
                // soma dos sub_alvo nunca ficar dessincronizada de hab_meta_base depois de
                // uma edição. his_sub_atividade_id é ON DELETE SET NULL, então apagar aqui
                // não derruba histórico de execução nenhum.]
                subAtividadeRepository.deleteAllByHabitoId(habitoId);
                gerarSubAtividades(habitoId, request.meta_base(), request.meta_frequencia_diaria(),
                                request.horario_agendado())
                                .forEach(subAtividadeRepository::save);
        }

        // @audit-ok [E0.5.5 — gera N sub_atividades repartindo metaBase igualmente
        // entre elas, jogando o resto na última (regra do plano). Pacote-privado (não
        // private) de propósito: HabitoServiceSubAtividadeTest testa isso direto, sem
        // precisar simular criarHabito inteiro.]
        List<SubAtividade> gerarSubAtividades(final UUID habitoId, final Integer metaBase,
                        final Integer vezesAoDiaRequisitado, final LocalTime horarioAgendado) {
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

                final var horario = horarioAgendado != null ? horarioAgendado : HORARIO_PADRAO;
                final var alvoBase = metaBase / vezesAoDia;
                final var resto = metaBase % vezesAoDia;

                final var subAtividades = new ArrayList<SubAtividade>();
                for (var ordem = 1; ordem <= vezesAoDia; ordem++) {
                        final var alvo = alvoBase + (ordem == vezesAoDia ? resto : 0);
                        subAtividades.add(SubAtividade.builder()
                                        .id(UUID.randomUUID())
                                        .habitoId(habitoId)
                                        .ordem(ordem)
                                        .horarioInicio(horario)
                                        .alvo(alvo)
                                        .build());
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
