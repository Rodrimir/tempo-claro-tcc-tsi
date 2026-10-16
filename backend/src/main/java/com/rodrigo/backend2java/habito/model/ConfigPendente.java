package com.rodrigo.backend2java.habito.model;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.rodrigo.backend2java.habito.model.HabitoRequestDTO.OcorrenciaRequestDTO;

// Configuração de execução editada que só vale a partir de vigenteEm (amanhã, no fuso do usuário).
// O dia em andamento continua com a configuração de antes; ApuracaoService aplica esta ao virar o dia.
@Entity
@Table(name = "habitos_config_pendente")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
public class ConfigPendente {

    @Id
    @Column(name = "hcp_habito_id")
    private UUID habitoId;

    @Column(name = "hcp_categoria")
    private String categoria;

    @Column(name = "hcp_tipo_medida")
    private String tipoMedida;

    @Column(name = "hcp_meta_base")
    private Integer metaBase;

    @Column(name = "hcp_meta_maxima")
    private Integer metaMaxima;

    @Column(name = "hcp_incremento")
    private Integer incremento;

    @Column(name = "hcp_dias_incremento")
    private Integer diasIncremento;

    @JdbcTypeCode(SqlTypes.CHAR)
    @Column(name = "hcp_frequencia_semanal", length = 7)
    private String frequenciaSemanal;

    @Column(name = "hcp_vezes_ao_dia")
    private Integer vezesAoDia;

    @Column(name = "hcp_horario_agendado")
    private LocalTime horarioAgendado;

    @Column(name = "hcp_ocorrencias")
    private String ocorrencias;

    @Column(name = "hcp_vigente_em")
    private LocalDate vigenteEm;

    @Builder.Default
    @Column(name = "hcp_criado_em")
    private OffsetDateTime criadoEm = OffsetDateTime.now();

    // "08:00|09:30;12:00|" : início|fim de cada ocorrência, fim opcional.
    public static String codificar(final List<OcorrenciaRequestDTO> ocorrencias) {
        if (ocorrencias == null || ocorrencias.isEmpty()) {
            return null;
        }
        final var partes = new ArrayList<String>();
        for (final var ocorrencia : ocorrencias) {
            partes.add(texto(ocorrencia.horario_inicio()) + "|" + texto(ocorrencia.horario_fim()));
        }
        return String.join(";", partes);
    }

    public List<OcorrenciaRequestDTO> ocorrenciasDecodificadas() {
        if (ocorrencias == null || ocorrencias.isBlank()) {
            return null;
        }
        final var lista = new ArrayList<OcorrenciaRequestDTO>();
        for (final var parte : ocorrencias.split(";")) {
            final var horarios = parte.split("\\|", -1);
            lista.add(new OcorrenciaRequestDTO(horario(horarios[0]),
                    horarios.length > 1 ? horario(horarios[1]) : null));
        }
        return lista;
    }

    private static String texto(final LocalTime horario) {
        return horario == null ? "" : horario.toString();
    }

    private static LocalTime horario(final String texto) {
        return texto == null || texto.isBlank() ? null : LocalTime.parse(texto);
    }
}
