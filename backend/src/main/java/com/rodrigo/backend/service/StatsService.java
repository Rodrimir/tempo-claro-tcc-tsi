package com.rodrigo.backend.service;

import java.util.Map;
import java.util.List;
import java.time.ZoneId;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import com.rodrigo.backend.model.Habito;
import com.rodrigo.backend.model.Usuario;
import org.springframework.stereotype.Service;
import com.rodrigo.backend.model.RegistroDiario;
import com.rodrigo.backend.repository.HabitoRepository;
import com.rodrigo.backend.repository.UsuarioRepository;
import com.rodrigo.backend.model.dto.response.DiaSemanalDTO;
import com.rodrigo.backend.repository.RegistroDiarioRepository;
import com.rodrigo.backend.repository.HistoricoExecucaoRepository;
import com.rodrigo.backend.exception.RecursoNaoEncontradoException;
import com.rodrigo.backend.model.dto.response.StatsWeeklyResponseDTO;

// @audit-ok [Estatísticas(2) — service de stats: agrega dados dos últimos 7 dias por hábito para o frontend]

@Service
@RequiredArgsConstructor
public class StatsService {

    private final HabitoRepository habitoRepository;
    private final UsuarioRepository usuarioRepository;
    private final RegistroDiarioRepository registroDiarioRepository;
    private final HistoricoExecucaoRepository historicoExecucaoRepository;

    // @audit-ok [Estatísticas(2) — busca stats dos últimos 7 dias para todos os hábitos do usuário autenticado]
    public List<StatsWeeklyResponseDTO> buscarStatsSemanal(final String emailContexto) {
        final Usuario usuario = usuarioRepository.findByEmail(emailContexto)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário não encontrado"));

        final LocalDate hoje = LocalDate.now(ZoneId.of(usuario.getFusoHorario()));
        final LocalDate inicio = hoje.minusDays(6);

        return habitoRepository.findAllByUsuarioId(usuario.getId()).stream()
                .map(habito -> montarStatsSemanal(habito, inicio, hoje))
                .collect(Collectors.toList());
    }

    private StatsWeeklyResponseDTO montarStatsSemanal(
            final Habito habito, final LocalDate inicio, final LocalDate hoje) {
        // @audit-info [Estatísticas(2) — monta Map<data, registro> para preencher os 7 dias sem lacunas]
        final Map<LocalDate, RegistroDiario> porData = registroDiarioRepository
                .findByHabitoIdAndDataFrom(habito.getId(), inicio).stream()
                .collect(Collectors.toMap(RegistroDiario::getDataExecucao, r -> r));

        final List<DiaSemanalDTO> dias = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            final LocalDate data = hoje.minusDays(i);
            final RegistroDiario r = porData.get(data);
            dias.add(new DiaSemanalDTO(
                    data,
                    r != null ? r.getStatus() : null,
                    r != null ? r.getValorTotalDia() : 0,
                    r != null ? r.getMetaDoDia() : habito.getMetaBase()));
        }

        final int recordValor = historicoExecucaoRepository.findMaxValorByHabitoId(habito.getId());
        return new StatsWeeklyResponseDTO(habito.getId(), habito.getTitulo(), dias, recordValor);
    }
}
