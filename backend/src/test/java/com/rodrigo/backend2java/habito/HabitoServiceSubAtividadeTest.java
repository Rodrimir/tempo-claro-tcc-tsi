package com.rodrigo.backend2java.habito;

import java.util.List;
import java.util.UUID;
import java.time.LocalTime;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.rodrigo.backend2java.usuario.Usuario;
import com.rodrigo.backend2java.calibracao.CalibracaoService;
import com.rodrigo.backend2java.execucao.StatusHabitoRepository;
import com.rodrigo.backend2java.execucao.HistoricoExecucaoRepository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class HabitoServiceSubAtividadeTest {

    @Mock
    private HabitoRepository habitoRepository;
    @Mock
    private StatusHabitoRepository statusHabitoRepository;
    @Mock
    private SubAtividadeRepository subAtividadeRepository;
    @Mock
    private ProximoVencimentoService proximoVencimentoService;
    @Mock
    private AcessoHabitoService acessoHabitoService;
    @Mock
    private CalibracaoService calibracaoService;
    @Mock
    private HistoricoExecucaoRepository historicoExecucaoRepository;

    private HabitoService novoHabitoService() {
        return new HabitoService(habitoRepository, statusHabitoRepository, subAtividadeRepository,
                proximoVencimentoService, acessoHabitoService, calibracaoService, historicoExecucaoRepository);
    }

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

    @Test
    void metaComResto_jogaSobraNaUltimaOcorrencia() {
        final var habitoService = novoHabitoService();
        final var habitoId = UUID.randomUUID();

        final var subAtividades = habitoService.gerarSubAtividades(habitoId, 10, 3, LocalTime.of(8, 0));

        assertEquals(List.of(3, 3, 4), subAtividades.stream().map(s -> s.getAlvo()).toList());
        assertEquals(10, subAtividades.stream().mapToInt(s -> s.getAlvo()).sum());
        assertEquals(LocalTime.of(8, 0), subAtividades.get(0).getHorarioInicio());
    }

    @Test
    void semVezesAoDiaInformado_geraUmaUnicaSubAtividadeComAMetaInteira() {
        final var habitoService = novoHabitoService();
        final var habitoId = UUID.randomUUID();

        final var subAtividades = habitoService.gerarSubAtividades(habitoId, 8, null, LocalTime.of(7, 30));

        assertEquals(1, subAtividades.size());
        assertEquals(1, subAtividades.get(0).getOrdem());
        assertEquals(8, subAtividades.get(0).getAlvo());
    }

    @Test
    void semHorarioInformado_comUmaOcorrencia_usaPadrao2359() {
        final var habitoService = novoHabitoService();
        final var habitoId = UUID.randomUUID();

        final var subAtividades = habitoService.gerarSubAtividades(habitoId, 8, 1, null);

        assertEquals(LocalTime.of(23, 59), subAtividades.get(0).getHorarioInicio());
    }

    @Test
    void maisDeUmaVezAoDia_semHorario_rejeitaAntesDeGerar() {
        final var habitoService = novoHabitoService();
        final var habitoId = UUID.randomUUID();

        assertThrows(RuntimeException.class,
                () -> habitoService.gerarSubAtividades(habitoId, 10, 3, null));
    }

    @Test
    void metaMenorQueVezesAoDia_rejeitaAntesDeGerarLinhaComAlvoZero() {
        final var habitoService = novoHabitoService();
        final var habitoId = UUID.randomUUID();

        assertThrows(RuntimeException.class,
                () -> habitoService.gerarSubAtividades(habitoId, 2, 3, LocalTime.of(8, 0)));
    }

    @Test
    void criarHabito_persisteAsSubAtividadesGeradas() {
        final var usuario = Usuario.builder().id(UUID.randomUUID()).email("teste@teste.com").build();
        when(acessoHabitoService.usuarioPorEmail(anyString())).thenReturn(usuario);
        when(habitoRepository.findAllByUsuarioIdAndAtivoTrue(any())).thenReturn(List.of());

        final var request = HabitoRequestDTO.builder()
                .titulo("Beber água")
                .categoria("AGUA")
                .tipo_medida("QUANTIDADE")
                .meta_base(2100)
                .meta_frequencia_diaria(3)
                .horario_agendado(LocalTime.of(8, 0))
                .build();

        novoHabitoService().criarHabito("teste@teste.com", request);

        verify(subAtividadeRepository, times(3)).save(any());
    }
}
