package com.rodrigo.backend.repository;

import java.util.UUID;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;
import com.rodrigo.backend.model.HistoricoExecucao;

@Repository
public class HistoricoExecucaoRepository {

    @PersistenceContext
    private EntityManager entityManager;

    public boolean existsByExecutionToken(UUID executionToken) {
        Long count = entityManager.createQuery(
                        "SELECT COUNT(h) FROM HistoricoExecucao h WHERE h.executionToken = :executionToken", Long.class)
                .setParameter("executionToken", executionToken)
                .getSingleResult();
        return count != null && count > 0;
    }

    public int findMaxValorByHabitoId(UUID habitoId) {
        Integer resultado = entityManager.createQuery(
                        "SELECT COALESCE(MAX(h.valorRealizado), 0) FROM HistoricoExecucao h WHERE h.habitoId = :habitoId",
                        Integer.class)
                .setParameter("habitoId", habitoId)
                .getSingleResult();
        return resultado != null ? resultado : 0;
    }

    public int countByTipoSucessoAndHabitoId(UUID habitoId, String tipoSucesso) {
        Long resultado = entityManager.createQuery(
                        "SELECT COUNT(h) FROM HistoricoExecucao h WHERE h.habitoId = :habitoId " +
                        "AND h.tipoSucesso = :tipoSucesso", Long.class)
                .setParameter("habitoId", habitoId)
                .setParameter("tipoSucesso", tipoSucesso)
                .getSingleResult();
        return resultado != null ? resultado.intValue() : 0;
    }

    public void save(HistoricoExecucao historico) {
        if (historico.getId() == null) {
            historico.setId(UUID.randomUUID());
        }
        entityManager.persist(historico);
        entityManager.flush();
    }
}
