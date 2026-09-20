package com.rodrigo.backend2java.habito;

import java.util.List;
import java.util.UUID;
import java.util.Set;
import java.util.ArrayList;
import java.util.Optional;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZonedDateTime;
import org.springframework.stereotype.Service;
import com.rodrigo.backend2java.usuario.Usuario;
import com.rodrigo.backend2java.infra.util.ZonaUsuario;

@Service
public class ProximoVencimentoService {

    private static final LocalTime HORARIO_PADRAO = LocalTime.of(23, 59);

    private static final int TOLERANCIA_FALHA_MINUTOS = 30;

    private final SubAtividadeRepository subAtividadeRepository;

    public ProximoVencimentoService(SubAtividadeRepository subAtividadeRepository) {
        this.subAtividadeRepository = subAtividadeRepository;
    }

    public enum StatusOcorrenciaHoje {
        FEITO, FALHOU, ATIVA, PENDENTE
    }

    public record OcorrenciaComStatus(SubAtividade subAtividade, StatusOcorrenciaHoje status) {
    }

    public List<OcorrenciaComStatus> calcularStatusDeHoje(final List<SubAtividade> subAtividadesOrdenadas,
            final Set<UUID> feitasHojeIds, final ZonedDateTime agora) {
        final var resultado = new ArrayList<OcorrenciaComStatus>();
        var jaEncontrouAtiva = false;
        for (final var subAtividade : subAtividadesOrdenadas) {
            final StatusOcorrenciaHoje status;
            if (feitasHojeIds.contains(subAtividade.getId())) {
                status = StatusOcorrenciaHoje.FEITO;
            } else {
                final var horarioInicio = subAtividade.getHorarioInicio() != null
                        ? subAtividade.getHorarioInicio()
                        : HORARIO_PADRAO;
                final var fimEfetivo = subAtividade.getHorarioFim() != null
                        ? subAtividade.getHorarioFim()
                        : horarioInicio;
                final var prazoFinal = agora.toLocalDate().atTime(fimEfetivo)
                        .plusMinutes(TOLERANCIA_FALHA_MINUTOS).atZone(agora.getZone());
                if (agora.isAfter(prazoFinal)) {
                    status = StatusOcorrenciaHoje.FALHOU;
                } else if (!jaEncontrouAtiva) {
                    status = StatusOcorrenciaHoje.ATIVA;
                    jaEncontrouAtiva = true;
                } else {
                    status = StatusOcorrenciaHoje.PENDENTE;
                }
            }
            resultado.add(new OcorrenciaComStatus(subAtividade, status));
        }
        return resultado;
    }

    public Optional<SubAtividade> encontrarAtiva(final List<SubAtividade> subAtividadesOrdenadas,
            final Set<UUID> feitasHojeIds, final ZonedDateTime agora) {
        return calcularStatusDeHoje(subAtividadesOrdenadas, feitasHojeIds, agora).stream()
                .filter(o -> o.status() == StatusOcorrenciaHoje.ATIVA)
                .map(OcorrenciaComStatus::subAtividade)
                .findFirst();
    }

    public OffsetDateTime calcular(final Habito habito, final Usuario usuario, final Set<UUID> feitasHojeIds) {
        final var subAtividades = subAtividadeRepository.findAllByHabitoIdOrderByOrdem(habito.getId());
        final var fuso = ZonaUsuario.resolver(usuario);
        final var agora = ZonedDateTime.now(fuso);

        final var ativa = encontrarAtiva(subAtividades, feitasHojeIds, agora);
        if (ativa.isPresent()) {
            final var horarioPendente = ativa.get().getHorarioInicio() != null
                    ? ativa.get().getHorarioInicio()
                    : HORARIO_PADRAO;
            return agora.toLocalDate().atTime(horarioPendente).atZone(fuso).toOffsetDateTime();
        }

        final var horarioPrimeiraOcorrencia = subAtividades.isEmpty() || subAtividades.get(0).getHorarioInicio() == null
                ? HORARIO_PADRAO
                : subAtividades.get(0).getHorarioInicio();
        var proximoDia = agora.toLocalDate().atTime(horarioPrimeiraOcorrencia).atZone(fuso).plusDays(1);

        proximoDia = avancarAteDiaProgramado(proximoDia, habito.getFrequenciaSemanal());

        return proximoDia.toOffsetDateTime();
    }

    private ZonedDateTime avancarAteDiaProgramado(ZonedDateTime candidato, final String frequenciaSemanal) {
        if (frequenciaSemanal == null || frequenciaSemanal.length() != 7) {
            return candidato;
        }
        for (var tentativas = 0; tentativas < 7; tentativas++) {
            if (FrequenciaSemanal.ehDiaProgramado(frequenciaSemanal, candidato.toLocalDate())) {
                return candidato;
            }
            candidato = candidato.plusDays(1);
        }
        return candidato;
    }
}
