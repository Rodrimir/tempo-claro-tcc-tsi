package com.rodrigo.backend2java.habito;
import java.util.List;
import java.util.UUID;
import lombok.Builder;
import java.time.LocalTime;
import java.time.OffsetDateTime;

/**
 * O hábito como o app o vê: definição, estado de hoje e estado de gamificação.
 *
 * <p>v3.0: era montado a partir de {@code vw_habito_hoje}. A §4.5 da monografia
 * determina que o banco não tenha views, e a derivação de {@code status} e de
 * {@code meta_frequencia_diaria} voltou para {@code HabitoService} — que já
 * carregava tudo de que precisava para calculá-las.
 */
@Builder(toBuilder = true)
public record HabitoResponseDTO(
        UUID id,
        String titulo,
        String categoria,
        String tipo_medida,
        Integer meta_base,
        /** Quantas ocorrências o dia tem. É a CONTAGEM de sub_atividades, nunca uma coluna. */
        Integer meta_frequencia_diaria,
        Boolean ativo,
        Integer moedas_locais,
        Integer bloqueios_acumulados,
        Integer dias_seguidos,
        Integer execucoes_hoje,
        /** Total realizado hoje — base da avaliação da meta (RF07) e do anel de progresso. */
        Integer valor_acumulado_hoje,
        OffsetDateTime proximo_vencimento,
        Boolean bloqueio_usado_hoje,

        /**
         * COMPLETED quando o total de hoje já alcançou a meta, PENDING enquanto não.
         * v3.0: era a contagem de execuções contra o número de ocorrências; RF07/RF13
         * avaliam o dia pelo total acumulado, então bater a meta em duas das três
         * ocorrências agora conta como cumprida.
         */
        String status,

        // @audit-ok [E2.3 — progressão automática de meta.]
        Integer meta_maxima,
        Integer incremento,
        Integer dias_incremento,

        // @audit-ok [E2.4 — máscara de 7 posições, domingo a sábado.]
        String frequencia_semanal,

        // @audit-ok [E2.8 (item 3) — "a ocorrência atual" é a próxima sub_atividade
        // pendente hoje (índice = execucoes_hoje, ou a última se todas já foram
        // feitas), calculada em HabitoService.enriquecerComOcorrenciaAtual.]
        Integer alvo_ocorrencia_atual,
        LocalTime horario_ocorrencia_atual,

        String gatilho_ancora,

        /**
         * RF14: sobe a cada dez dias seguidos, com teto de serviço em 5 (a arte tem
         * cinco variações). Era {@code 1 + dias_seguidos}, ou seja, subia todo dia.
         */
        Integer nivel_avatar,

        // @audit-ok [E4.2 (item 2) — lista completa das sub_atividades, para a tela
        // de edição pré-preencher o horário de CADA ocorrência.]
        List<OcorrenciaResponseDTO> ocorrencias) {

    @Builder
    public record OcorrenciaResponseDTO(
            LocalTime horario_inicio,
            LocalTime horario_fim,
            Integer alvo,
            /**
             * FEITO | FALHOU | ATIVA | PENDENTE — ver
             * {@link ProximoVencimentoService#calcularStatusDeHoje}. ATIVA é a única
             * ocorrência que a Home libera pra fazer agora; PENDENTE ainda nem chegou
             * a vez.
             */
            String status) {
    }
}
