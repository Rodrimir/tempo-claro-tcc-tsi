package com.rodrigo.backend2java.habito;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import com.rodrigo.backend2java.habito.model.ConfigPendente;

public interface ConfigPendenteRepository extends JpaRepository<ConfigPendente, UUID> {

    List<ConfigPendente> findAllByHabitoIdIn(List<UUID> habitoIds);
}
