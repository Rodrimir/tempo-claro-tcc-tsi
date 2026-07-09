package com.rodrigo.backend.repository;

import java.util.UUID;
import java.util.List;
import java.util.Optional;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;
import com.rodrigo.backend.model.SubAtividade;

@Repository
public class SubAtividadeRepository {

    @PersistenceContext
    private EntityManager entityManager;

    public List<SubAtividade> findByHabitoId(UUID habitoId) {
        var resultado = entityManager.createQuery(
                        "SELECT s FROM SubAtividade s WHERE s.habitoId = :habitoId ORDER BY s.ordem",
                        SubAtividade.class)
                .setParameter("habitoId", habitoId)
                .getResultList();
        resultado.forEach(entityManager::detach);
        return resultado;
    }

    public Optional<SubAtividade> findById(UUID id) {
        var subAtividade = entityManager.find(SubAtividade.class, id);
        if (subAtividade != null) {
            entityManager.detach(subAtividade);
        }
        return Optional.ofNullable(subAtividade);
    }

    public void save(SubAtividade subAtividade) {
        if (subAtividade.getId() == null) {
            subAtividade.setId(UUID.randomUUID());
        }
        entityManager.persist(subAtividade);
        entityManager.flush();
    }

    public void deleteByHabitoId(UUID habitoId) {
        entityManager.createQuery("DELETE FROM SubAtividade s WHERE s.habitoId = :habitoId")
                .setParameter("habitoId", habitoId)
                .executeUpdate();
    }
}
