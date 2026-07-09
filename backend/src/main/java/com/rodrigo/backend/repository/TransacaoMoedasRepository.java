package com.rodrigo.backend.repository;

import java.util.UUID;
import java.time.OffsetDateTime;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;
import com.rodrigo.backend.model.TransacaoMoedas;

@Repository
public class TransacaoMoedasRepository {

    @PersistenceContext
    private EntityManager entityManager;

    public void save(TransacaoMoedas transacao) {
        if (transacao.getId() == null) {
            transacao.setId(UUID.randomUUID());
        }
        entityManager.persist(transacao);
        entityManager.flush();
    }

    public int findSaldoByHabitoId(UUID habitoId) {
        Long resultado = entityManager.createQuery(
                        "SELECT COALESCE(SUM(t.valor), 0) FROM TransacaoMoedas t WHERE t.habitoId = :habitoId", Long.class)
                .setParameter("habitoId", habitoId)
                .getSingleResult();
        return resultado != null ? resultado.intValue() : 0;
    }

    public int countByTipoAndHabitoId(UUID habitoId, String tipo) {
        Long resultado = entityManager.createQuery(
                        "SELECT COUNT(t) FROM TransacaoMoedas t WHERE t.habitoId = :habitoId AND t.tipo = :tipo", Long.class)
                .setParameter("habitoId", habitoId)
                .setParameter("tipo", tipo)
                .getSingleResult();
        return resultado != null ? resultado.intValue() : 0;
    }

    public boolean existsCreditoNoDia(UUID habitoId, OffsetDateTime inicio, OffsetDateTime fim) {
        Long resultado = entityManager.createQuery(
                        "SELECT COUNT(t) FROM TransacaoMoedas t WHERE t.habitoId = :habitoId " +
                        "AND t.tipo LIKE 'CREDITO%' AND t.dataHora >= :inicio AND t.dataHora < :fim", Long.class)
                .setParameter("habitoId", habitoId)
                .setParameter("inicio", inicio)
                .setParameter("fim", fim)
                .getSingleResult();
        return resultado != null && resultado > 0;
    }
}
