package com.rodrigo.backend.model.dto.response;

import java.util.UUID;
import lombok.Builder;
import java.util.List;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import com.rodrigo.backend.model.dto.SubAtividadeDTO;

// @audit-ok [Dashboard(1RES) / Criar Hábito(1RES) — response DTO com gamificação: saldo, ofensiva, nível e avatar por hábito]

@Builder
public record HabitoResponseDTO(
        UUID id,
        UUID categoriaId,
        String categoriaCodigo,
        String categoriaNome,
        String titulo,
        String gatilhoAncora,
        String tipo_medida,
        LocalTime horario_agendado,
        Integer meta_base,
        Integer meta_maxima,
        Integer dias_para_aumento,
        Integer incremento_meta,
        Boolean ativo,
        OffsetDateTime arquivadoEm,
        List<SubAtividadeDTO> sub_atividades,
        List<Integer> dias_semana,
        Integer saldo,
        Integer escudosDisponiveis,
        Integer ofensiva,
        Integer nivel,
        String avatarUrl) {
}
