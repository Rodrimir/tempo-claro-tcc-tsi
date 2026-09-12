package com.rodrigo.backend2java.habito;
import java.util.UUID;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

// @audit-ok [Schema v2.1, tabela sub_atividades — repositório criado na
// E0.5.3. Consumido pela primeira vez na E0.5.5 (HabitoService.criarHabito /
// atualizarHabito): findAllByHabitoId e a agregação de meta_frequencia_diaria
// (ver vw_habito_hoje) seguem para a E1.1.]
public interface SubAtividadeRepository extends JpaRepository<SubAtividade, UUID> {

    List<SubAtividade> findAllByHabitoIdOrderByOrdem(UUID habitoId);

    // As ocorrências de vários hábitos numa consulta só. É o que permite montar o
    // dashboard inteiro com um número fixo de queries, em vez de duas por hábito
    // (o N+1 medido por HabitoDashboardQueryCountTest).
    List<SubAtividade> findAllByHabitoIdInOrderByHabitoIdAscOrdemAsc(List<UUID> habitoIds);

    // @audit-ok [E0.5.5 — usado por HabitoService.atualizarHabito para recalcular
    // as sub_atividades do zero a cada edição.]
    @Modifying(clearAutomatically = true)
    @Transactional
    @Query(value = "DELETE FROM sub_atividades WHERE sub_habito_id = ?1", nativeQuery = true)
    void deleteAllByHabitoId(UUID habitoId);
}
