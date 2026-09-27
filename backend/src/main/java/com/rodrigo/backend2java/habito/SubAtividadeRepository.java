package com.rodrigo.backend2java.habito;
import java.util.UUID;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;
import com.rodrigo.backend2java.habito.model.SubAtividade;

public interface SubAtividadeRepository extends JpaRepository<SubAtividade, UUID> {

    List<SubAtividade> findAllByHabitoIdOrderByOrdem(UUID habitoId);

    List<SubAtividade> findAllByHabitoIdInOrderByHabitoIdAscOrdemAsc(List<UUID> habitoIds);

    @Modifying(clearAutomatically = true)
    @Transactional
    @Query(value = "DELETE FROM sub_atividades WHERE sub_habito_id = ?1", nativeQuery = true)
    void deleteAllByHabitoId(UUID habitoId);
}
