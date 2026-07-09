package com.rodrigo.backend.repository;

import java.util.UUID;
import java.util.List;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;
import com.rodrigo.backend.model.HabitoDiaSemana;

@Repository
public class HabitoDiaSemanaRepository {

    @PersistenceContext
    private EntityManager entityManager;

    public List<Integer> findByHabitoId(UUID habitoId) {
        return entityManager.createQuery(
                        "SELECT h.diaSemana FROM HabitoDiaSemana h WHERE h.habitoId = :habitoId ORDER BY h.diaSemana",
                        Integer.class)
                .setParameter("habitoId", habitoId)
                .getResultList();
    }

    public void saveAll(UUID habitoId, List<Integer> dias) {
        for (Integer dia : dias) {
            entityManager.persist(new HabitoDiaSemana(habitoId, dia));
        }
        entityManager.flush();
    }

    public void deleteByHabitoId(UUID habitoId) {
        entityManager.createQuery("DELETE FROM HabitoDiaSemana h WHERE h.habitoId = :habitoId")
                .setParameter("habitoId", habitoId)
                .executeUpdate();
    }
}
