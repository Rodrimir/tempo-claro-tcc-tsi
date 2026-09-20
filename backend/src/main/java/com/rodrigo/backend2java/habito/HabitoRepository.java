package com.rodrigo.backend2java.habito;
import java.util.UUID;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

public interface HabitoRepository extends JpaRepository<Habito, UUID> {

    List<Habito> findAllByUsuarioIdAndAtivoTrue(UUID usuarioId);

    List<Habito> findAllByAtivoTrue();

    @Modifying(clearAutomatically = true)
    @Transactional
    @Query(value = "UPDATE habitos SET hab_ativo = false, hab_arquivado_em = CURRENT_TIMESTAMP WHERE hab_id = ?1",
           nativeQuery = true)
    void archive(UUID id);
}
