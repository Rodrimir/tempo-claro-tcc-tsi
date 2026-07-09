package com.rodrigo.backend.repository;

import java.util.UUID;
import java.util.Optional;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;
import com.rodrigo.backend.model.CategoriaHabito;

@Repository
public class CategoriaHabitoRepository {

    @PersistenceContext
    private EntityManager entityManager;

    public Optional<CategoriaHabito> findByCodigo(String codigo) {
        var resultado = entityManager.createQuery(
                        "SELECT c FROM CategoriaHabito c WHERE c.codigo = :codigo", CategoriaHabito.class)
                .setParameter("codigo", codigo)
                .getResultList();
        resultado.forEach(entityManager::detach);
        return resultado.stream().findFirst();
    }

    public Optional<CategoriaHabito> findById(UUID id) {
        var categoria = entityManager.find(CategoriaHabito.class, id);
        if (categoria != null) {
            entityManager.detach(categoria);
        }
        return Optional.ofNullable(categoria);
    }
}
