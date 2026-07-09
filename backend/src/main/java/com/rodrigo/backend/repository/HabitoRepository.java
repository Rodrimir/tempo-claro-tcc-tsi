package com.rodrigo.backend.repository;

import java.util.UUID;
import java.util.List;
import java.util.Optional;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import com.rodrigo.backend.model.Habito;
import org.springframework.stereotype.Repository;

@Repository
public class HabitoRepository {

    @PersistenceContext
    private EntityManager entityManager;

    public List<Habito> findAllByUsuarioId(UUID usuarioId) {
        var resultado = entityManager.createQuery(
                        "SELECT h FROM Habito h WHERE h.usuarioId = :usuarioId " +
                        "AND h.ativo = true AND h.arquivadoEm IS NULL", Habito.class)
                .setParameter("usuarioId", usuarioId)
                .getResultList();
        resultado.forEach(entityManager::detach);
        return resultado;
    }

    public Optional<Habito> findById(UUID id) {
        var habito = entityManager.find(Habito.class, id);
        if (habito != null) {
            entityManager.detach(habito);
        }
        return Optional.ofNullable(habito);
    }

    public List<Habito> findAllAtivos() {
        var resultado = entityManager.createQuery(
                        "SELECT h FROM Habito h WHERE h.ativo = true AND h.arquivadoEm IS NULL", Habito.class)
                .getResultList();
        resultado.forEach(entityManager::detach);
        return resultado;
    }

    public void save(Habito habito) {
        if (habito.getId() == null) {
            habito.setId(UUID.randomUUID());
        }
        entityManager.persist(habito);
        entityManager.flush();
    }

    public void update(Habito habito) {
        entityManager.merge(habito);
        entityManager.flush();
    }

    public void archive(UUID id) {
        entityManager.createNativeQuery(
                        "UPDATE habitos SET ativo = FALSE, arquivado_em = now() WHERE id = ?")
                .setParameter(1, id)
                .executeUpdate();
    }
}
