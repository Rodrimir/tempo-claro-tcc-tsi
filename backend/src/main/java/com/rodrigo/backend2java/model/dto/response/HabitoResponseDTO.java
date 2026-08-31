package com.rodrigo.backend2java.model.dto.response;
import java.util.List;
import java.util.UUID;
import lombok.Builder;
import java.time.LocalTime;
import java.time.OffsetDateTime;
// @audit-ok [E2.8 — toBuilder=true: HabitoService.enriquecerComOcorrenciaAtual
// parte da resposta já montada por HabitoHojeRepository (a partir da view) e só
// acrescenta 2 campos, sem precisar relistar os outros já existentes.]
@Builder(toBuilder = true)
public record HabitoResponseDTO(
        UUID id,
        String titulo,
        String categoria,
        String tipo_medida,
        String modalidade,
        LocalTime horario_agendado,
        Integer meta_base,
        Integer meta_frequencia_diaria,
        // @audit-ok [E2.9 (item 4) — intervalo_minutos removido: nunca teve
        // coluna correspondente em nenhuma tabela do schema v2.1, e o frontend
        // nunca leu esse campo de nenhuma resposta (confirmado por busca em
        // todo o frontend/src). Ver docs/CONTRATO_API.md.]
        Boolean ativo,
        Integer moedas_locais,
        Integer bloqueios_acumulados,
        Integer dias_seguidos,
        Integer execucoes_hoje,
        OffsetDateTime proximo_vencimento,
        Boolean bloqueio_usado_hoje,
        // @audit-ok [E1.1 — COMPLETED/PENDING, direto de vw_habito_hoje.status_hoje.
        // Campo novo, adicionado no fim do record para não mexer na ordem dos 16
        // campos existentes.]
        String status,

        // @audit-ok [E2.3 — progressão automática de meta, no fim do record pelo
        // mesmo motivo do campo acima.]
        Integer meta_maxima,
        Integer incremento,
        Integer dias_incremento,

        // @audit-ok [E2.4 — no fim do record, mesmo motivo dos campos acima.]
        String frequencia_semanal,

        // @audit-ok [E2.8 (item 3) — "a ocorrência atual" é a próxima
        // sub_atividade pendente hoje (índice = execucoes_hoje, ou a última se
        // todas já foram feitas). Calculado em
        // HabitoService.enriquecerComOcorrenciaAtual — vw_habito_hoje agrega no
        // nível do hábito, não tem como expressar "a ocorrência atual" como
        // coluna simples sem um LATERAL join.]
        Integer alvo_ocorrencia_atual,
        LocalTime horario_ocorrencia_atual,

        // @audit-ok [E4.1 — hab_gatilho_ancora já era persistido de ponta a
        // ponta desde a E2.9 (request -> Habito -> banco), só nunca tinha
        // voltado na resposta. No fim do record, mesmo motivo dos campos
        // acima (não mexer na ordem dos já existentes).]
        String gatilho_ancora,

        // @audit-ok [E4.2 (item 2) — lista completa das sub_atividades do
        // hábito (não só "a atual", que alvo_ocorrencia_atual/
        // horario_ocorrencia_atual já cobriam desde a E2.8). Existe pra tela
        // de edição pré-preencher o horário de CADA ocorrência de um hábito
        // de mais de 1x/dia, não só a próxima pendente.]
        List<OcorrenciaResponseDTO> ocorrencias) {

    @Builder
    public record OcorrenciaResponseDTO(
            LocalTime horario_inicio,
            LocalTime horario_fim,
            Integer alvo) {
    }
}
