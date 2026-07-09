package com.rodrigo.backend.repository;

import java.util.UUID;
import java.util.Optional;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;
import com.rodrigo.backend.model.SessaoExecucao;

@Repository
public class SessaoExecucaoRepository {

    @PersistenceContext
    private EntityManager entityManager;

    public void save(SessaoExecucao sessao) {
        entityManager.persist(sessao);
        entityManager.flush();
    }

    public Optional<SessaoExecucao> findById(UUID id) {
        var sessao = entityManager.find(SessaoExecucao.class, id);
        if (sessao != null) {
            entityManager.detach(sessao);
        }
        return Optional.ofNullable(sessao);
    }

    public Optional<SessaoExecucao> findAtivaByHabitoId(UUID habitoId) {
        var resultado = entityManager.createQuery(
                        "SELECT s FROM SessaoExecucao s WHERE s.habitoId = :habitoId " +
                        "AND s.estado IN ('EM_EXECUCAO','PAUSADO')", SessaoExecucao.class)
                .setParameter("habitoId", habitoId)
                .setMaxResults(1)
                .getResultList();
        resultado.forEach(entityManager::detach);
        return resultado.stream().findFirst();
    }

    public void update(SessaoExecucao sessao) {
        entityManager.merge(sessao);
        entityManager.flush();
    }
}
