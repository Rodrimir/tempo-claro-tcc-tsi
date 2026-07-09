package com.rodrigo.backend.repository;

import java.util.UUID;
import java.util.Optional;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;
import com.rodrigo.backend.model.AvatarCatalogo;

@Repository
public class AvatarCatalogoRepository {

    @PersistenceContext
    private EntityManager entityManager;

    public Optional<AvatarCatalogo> findByCategoriaAndStreak(UUID categoriaId, String estadoExpressao, int streak) {
        var resultado = entityManager.createQuery(
                        "SELECT a FROM AvatarCatalogo a WHERE a.categoriaId = :categoriaId " +
                        "AND a.estadoExpressao = :estadoExpressao AND a.streakMinimo <= :streak " +
                        "ORDER BY a.streakMinimo DESC", AvatarCatalogo.class)
                .setParameter("categoriaId", categoriaId)
                .setParameter("estadoExpressao", estadoExpressao)
                .setParameter("streak", streak)
                .setMaxResults(1)
                .getResultList();
        resultado.forEach(entityManager::detach);
        return resultado.stream().findFirst();
    }
}
