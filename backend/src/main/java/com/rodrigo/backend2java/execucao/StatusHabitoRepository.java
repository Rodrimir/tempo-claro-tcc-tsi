package com.rodrigo.backend2java.execucao;
import java.util.List;
import java.util.UUID;
import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.rodrigo.backend2java.execucao.model.StatusHabito;
public interface StatusHabitoRepository extends JpaRepository<StatusHabito, UUID> {

    List<StatusHabito> findAllByHabitoIdIn(List<UUID> habitoIds);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM StatusHabito s WHERE s.habitoId = :habitoId")
    Optional<StatusHabito> travarPorHabitoId(@Param("habitoId") UUID habitoId);
}
