package com.rodrigo.backend2java.service;

import java.util.List;
import java.util.UUID;
import java.util.Optional;
import java.time.LocalTime;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.rodrigo.backend2java.model.Usuario;
import com.rodrigo.backend2java.model.dto.request.HabitoRequestDTO;
import com.rodrigo.backend2java.model.dto.response.HabitoResponseDTO;
import com.rodrigo.backend2java.repository.HabitoRepository;
import com.rodrigo.backend2java.repository.UsuarioRepository;
import com.rodrigo.backend2java.repository.HabitoHojeRepository;
import com.rodrigo.backend2java.repository.StatusHabitoRepository;
import com.rodrigo.backend2java.repository.SubAtividadeRepository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

// @audit-ok [E0.5.5 — primeiro teste automatizado do repositório (não havia
// backend/src/test/ antes desta tarefa). Cobre item 2 (rateio da meta entre N
// ocorrências, resto na última), item 1 (toda criação de hábito gera ao menos
// 1 sub_atividade) e item 3 (validação da soma / da divisibilidade mínima).]
@ExtendWith(MockitoExtension.class)
class HabitoServiceSubAtividadeTest {

    @Mock
    private HabitoRepository habitoRepository;
    @Mock
    private StatusHabitoRepository statusHabitoRepository;
    @Mock
    private UsuarioRepository usuarioRepository;
    @Mock
    private SubAtividadeRepository subAtividadeRepository;
    @Mock
    private HabitoHojeRepository habitoHojeRepository;
    @Mock
    private ProximoVencimentoService proximoVencimentoService;

    private HabitoService novoHabitoService() {
        return new HabitoService(habitoRepository, statusHabitoRepository, usuarioRepository,
                subAtividadeRepository, habitoHojeRepository, proximoVencimentoService);
    }

    // @audit-ok [Caso pedido no plano (E0.5.5): hábito de 2100 ml em 3 vezes ao
    // dia deve gerar exatamente 3 sub_atividades de 700 ml cada — divisão exata,
    // resto zero.]
    @Test
    void habitoDe2100ml_em3vezes_geraTresLinhasDe700() {
        final var habitoService = novoHabitoService();
        final var habitoId = UUID.randomUUID();

        final var subAtividades = habitoService.gerarSubAtividades(habitoId, 2100, 3, LocalTime.of(8, 0));

        assertEquals(3, subAtividades.size());
        for (var i = 0; i < 3; i++) {
            assertEquals(i + 1, subAtividades.get(i).getOrdem());
            assertEquals(700, subAtividades.get(i).getAlvo());
        }
        assertEquals(2100, subAtividades.stream().mapToInt(s -> s.getAlvo()).sum());
    }

    // @audit-ok [Item 2 — "jogando o resto na última ocorrência". O caso de
    // 2100/3 acima não testa isso sozinho (resto = 0); 10 em 3 vezes prova a
    // regra: 3, 3 e 4 (o resto de 1 cai na 3ª).
    // E2.6 (item 6): passou a exigir horário explícito com mais de 1x/dia —
    // este teste ganhou LocalTime.of(8,0) pra continuar válido; a cobertura de
    // "horário nulo cai em 23:59" migrou pra
    // semHorarioInformado_comUmaOcorrencia_usaPadrao2359 (só é permitido com
    // vezesAoDia=1 agora).]
    @Test
    void metaComResto_jogaSobraNaUltimaOcorrencia() {
        final var habitoService = novoHabitoService();
        final var habitoId = UUID.randomUUID();

        final var subAtividades = habitoService.gerarSubAtividades(habitoId, 10, 3, LocalTime.of(8, 0));

        assertEquals(List.of(3, 3, 4), subAtividades.stream().map(s -> s.getAlvo()).toList());
        assertEquals(10, subAtividades.stream().mapToInt(s -> s.getAlvo()).sum());
        assertEquals(LocalTime.of(8, 0), subAtividades.get(0).getHorarioInicio());
    }

    // @audit-ok [Item 1 — hábito sem "vezes ao dia" informado gera 1 única
    // sub_atividade com o alvo igual à meta base inteira.]
    @Test
    void semVezesAoDiaInformado_geraUmaUnicaSubAtividadeComAMetaInteira() {
        final var habitoService = novoHabitoService();
        final var habitoId = UUID.randomUUID();

        final var subAtividades = habitoService.gerarSubAtividades(habitoId, 8, null, LocalTime.of(7, 30));

        assertEquals(1, subAtividades.size());
        assertEquals(1, subAtividades.get(0).getOrdem());
        assertEquals(8, subAtividades.get(0).getAlvo());
    }

    // @audit-ok [Item 1 — horário nulo cai no padrão 23:59, mas só é permitido
    // quando há 1 única ocorrência ao dia (ver teste seguinte pra quando não é).]
    @Test
    void semHorarioInformado_comUmaOcorrencia_usaPadrao2359() {
        final var habitoService = novoHabitoService();
        final var habitoId = UUID.randomUUID();

        final var subAtividades = habitoService.gerarSubAtividades(habitoId, 8, 1, null);

        assertEquals(LocalTime.of(23, 59), subAtividades.get(0).getHorarioInicio());
    }

    // @audit-ok [E2.6 (item 6) — regra nova: com mais de 1 vez ao dia, todas as
    // ocorrências compartilham o mesmo horário (E0.5.5 ainda não diferencia
    // horário por ocorrência), então deixar em branco faria todas caírem em
    // 23:59 sem o usuário ter escolhido isso. O servidor passa a exigir o
    // mesmo que o formulário (CreateHabit.jsx) já exige.]
    @Test
    void maisDeUmaVezAoDia_semHorario_rejeitaAntesDeGerar() {
        final var habitoService = novoHabitoService();
        final var habitoId = UUID.randomUUID();

        assertThrows(RuntimeException.class,
                () -> habitoService.gerarSubAtividades(habitoId, 10, 3, null));
    }

    // @audit-ok [Item 3 — não dá para repartir uma meta de 2 em 3 ocorrências
    // sem alguma ficar com sub_alvo = 0, o que violaria ck_sub_alvo (>= 1) no
    // banco. O service rejeita antes de chegar a violar o schema.]
    @Test
    void metaMenorQueVezesAoDia_rejeitaAntesDeGerarLinhaComAlvoZero() {
        final var habitoService = novoHabitoService();
        final var habitoId = UUID.randomUUID();

        assertThrows(RuntimeException.class,
                () -> habitoService.gerarSubAtividades(habitoId, 2, 3, LocalTime.of(8, 0)));
    }

    // @audit-ok [Item 1, fim a fim: criar um hábito de fato persiste as
    // sub_atividades geradas — não fica só na função pura.]
    @Test
    void criarHabito_persisteAsSubAtividadesGeradas() {
        final var usuario = Usuario.builder().id(UUID.randomUUID()).email("teste@teste.com").build();
        when(usuarioRepository.findByEmail(anyString())).thenReturn(Optional.of(usuario));
        when(habitoRepository.findAllByUsuarioId(any())).thenReturn(List.of());
        // E1.1: buscarDetalhadoPorId agora lê vw_habito_hoje via HabitoHojeRepository,
        // não mais HabitoRepository/StatusHabitoRepository — só esse mock importa aqui.
        when(habitoHojeRepository.findByHabitoId(any()))
                .thenReturn(Optional.of(HabitoResponseDTO.builder().build()));

        final var request = HabitoRequestDTO.builder()
                .titulo("Beber água")
                .categoria("AGUA")
                .tipo_medida("QUANTIDADE")
                .modalidade("DIARIA")
                .meta_base(2100)
                .meta_frequencia_diaria(3)
                // @audit-ok [E2.6 (item 6) — obrigatório agora que
                // meta_frequencia_diaria > 1; sem isso gerarSubAtividades rejeita.]
                .horario_agendado(LocalTime.of(8, 0))
                .build();

        novoHabitoService().criarHabito("teste@teste.com", request);

        verify(subAtividadeRepository, times(3)).save(any());
    }
}
