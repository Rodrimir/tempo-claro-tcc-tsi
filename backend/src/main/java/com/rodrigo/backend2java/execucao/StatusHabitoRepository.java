package com.rodrigo.backend2java.execucao;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
// @audit-ok [Dashboard (9) / Execução Timer (24) / Loja Escudo (14) — repositório de status de gamificação por hábito]
//
// v3.0: a native query resetarDiario saiu. Zerar contadores deixou de ser uma
// operação isolada — virou o último passo de FechamentoService.fecharDia, que no
// mesmo movimento credita moedas, move a ofensiva e recalcula o nível. A guarda de
// idempotência continua sendo sta_ultimo_reset, agora avaliada no job antes de
// apurar cada dia pendente.
public interface StatusHabitoRepository extends JpaRepository<StatusHabito, UUID> {

    // Carrega o status de vários hábitos de uma vez — é o que permite montar o
    // dashboard sem uma consulta por hábito (o N+1 que a view mascarava).
    List<StatusHabito> findAllByHabitoIdIn(List<UUID> habitoIds);
}
