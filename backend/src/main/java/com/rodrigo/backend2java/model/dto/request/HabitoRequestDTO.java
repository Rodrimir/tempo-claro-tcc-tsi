package com.rodrigo.backend2java.model.dto.request;
import java.util.List;
import lombok.Builder;
import java.time.LocalTime;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@Builder
public record HabitoRequestDTO(
        @NotBlank(message = "O título é obrigatório") @Size(max = 60, message = "O título pode ter no máximo 60 caracteres") String titulo,

        String categoria,

        @NotNull(message = "A meta base é obrigatória") @Min(value = 1, message = "A meta base deve ser maior que zero") Integer meta_base,

        @NotBlank(message = "O tipo de medida é obrigatório") String tipo_medida,

        @NotBlank(message = "A modalidade é obrigatória") String modalidade,

        // @audit-ok [E2.6 (item 6) — mesmo limite de 1 a 12 que
        // HabitoService.gerarSubAtividades já aplicava via RuntimeException;
        // agora falha mais cedo, com a mesma faixa que o formulário valida.]
        @Min(value = 1, message = "Vezes ao dia deve ser pelo menos 1") @Max(value = 12, message = "Vezes ao dia não pode passar de 12") Integer meta_frequencia_diaria,

        // @audit-ok [E2.9 (item 4) — hab_gatilho_ancora VARCHAR(120): mesmo
        // limite replicado aqui que já existe em titulo/VARCHAR(60) (E2.6).]
        @Size(max = 120, message = "O gatilho pode ter no máximo 120 caracteres") String gatilho_ancora,
        LocalTime horario_agendado,

        // @audit-ok [E2.3 — progressão automática de meta. meta_maxima fica sem
        // @Min de propósito: null é o valor válido para "sem teto" (ck_hab_teto
        // do schema só exige meta_maxima >= meta_base QUANDO não for nulo — essa
        // parte, por cruzar dois campos, fica a cargo do CHECK do banco mesmo,
        // traduzido em mensagem legível pelo GlobalExceptionHandler, item 4).]
        Integer meta_maxima,
        @Min(value = 0, message = "O incremento não pode ser negativo") Integer incremento,
        @Min(value = 1, message = "O incremento deve se repetir a cada 1 dia ou mais") Integer dias_incremento,

        // @audit-ok [E2.4 — máscara de 7 dígitos '0'/'1', domingo (posição 1) a
        // sábado (posição 7). Null/omitido vira '1111111' (todo dia) em
        // HabitoService.criarHabito, mesmo default do schema. A checagem de
        // "não pode ser tudo zero" (ck_hab_freq) fica a cargo do CHECK do banco
        // + GlobalExceptionHandler — @Pattern não cobre "não são todos iguais".]
        @Pattern(regexp = "^[01]{7}$", message = "A frequência semanal deve ter 7 dígitos, cada um 0 ou 1") String frequencia_semanal,

        // @audit-ok [E2.8 (item 1) — usado quando meta_frequencia_diaria > 1:
        // uma entrada por ocorrência, na mesma ordem (índice 0 = sub_ordem 1).
        // horario_agendado continua existindo pro caso de 1x/dia (compatível
        // com todo hábito criado antes desta tarefa) — os dois nunca são
        // usados ao mesmo tempo, ver HabitoService.gerarSubAtividades.]
        List<OcorrenciaRequestDTO> ocorrencias) {

    // @audit-ok [E2.8 — horario_fim é opcional de propósito (item 1: "e,
    // opcionalmente, o fim"); horario_inicio é obrigatório quando esta lista é
    // usada, validado em HabitoService.gerarSubAtividades (mesmo lugar que já
    // validava o horário único antes da E2.8), não aqui via anotação — mantém
    // a validação de "obrigatório com >1x/dia" num só lugar.]
    public record OcorrenciaRequestDTO(LocalTime horario_inicio, LocalTime horario_fim) {
    }
}
