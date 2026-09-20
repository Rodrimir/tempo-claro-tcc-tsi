package com.rodrigo.backend2java.execucao;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
public interface StatusHabitoRepository extends JpaRepository<StatusHabito, UUID> {

    List<StatusHabito> findAllByHabitoIdIn(List<UUID> habitoIds);
}
