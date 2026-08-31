package com.rodrigo.backend2java.model.dto.request;
import lombok.Builder;
import java.util.UUID;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

@Builder
public record ExecutionRequestDTO(
        @NotNull(message = "Token de execução é obrigatório") UUID execution_token,

        // @audit-ok [E1.6 (item 1/4) — deixou de ser obrigatório. Uma conclusão
        // honesta (front atual) não manda mais este campo — GamificacaoService
        // trata ausente/em branco como pedido de conclusão e recalcula o bônus
        // sozinho. Continua existindo só para o cliente conseguir dizer
        // FAIL_BLOQUEIO/FAIL_TIMEOUT (intenção do usuário na desistência, não
        // cálculo de bônus) e, num cliente adulterado, tentar (sem sucesso)
        // reivindicar COMPLETE_EXTRA.]
        String tipo,

        @NotNull(message = "O valor realizado é obrigatório") @Min(value = 0, message = "Valor não pode ser negativo") Integer valor_realizado) {
}
