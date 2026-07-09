package com.rodrigo.backend.repository;

import java.util.UUID;
import java.util.List;
import java.util.Optional;
import java.time.LocalDate;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;
import com.rodrigo.backend.model.RegistroDiario;

@Repository
public class RegistroDiarioRepository {

    @PersistenceContext
    private EntityManager entityManager;

    public Optional<RegistroDiario> findByHabitoIdAndData(UUID habitoId, LocalDate data) {
        var resultado = entityManager.createQuery(
                        "SELECT r FROM RegistroDiario r WHERE r.habitoId = :habitoId AND r.dataExecucao = :data",
                        RegistroDiario.class)
                .setParameter("habitoId", habitoId)
                .setParameter("data", data)
                .getResultList();
        resultado.forEach(entityManager::detach);
        return resultado.stream().findFirst();
    }

    public List<RegistroDiario> findAllByHabitoId(UUID habitoId) {
        var resultado = entityManager.createQuery(
                        "SELECT r FROM RegistroDiario r WHERE r.habitoId = :habitoId ORDER BY r.dataExecucao DESC",
                        RegistroDiario.class)
                .setParameter("habitoId", habitoId)
                .getResultList();
        resultado.forEach(entityManager::detach);
        return resultado;
    }

    public List<RegistroDiario> findByHabitoIdAndDataFrom(UUID habitoId, LocalDate from) {
        var resultado = entityManager.createQuery(
                        "SELECT r FROM RegistroDiario r WHERE r.habitoId = :habitoId AND r.dataExecucao >= :from " +
                        "ORDER BY r.dataExecucao ASC", RegistroDiario.class)
                .setParameter("habitoId", habitoId)
                .setParameter("from", from)
                .getResultList();
        resultado.forEach(entityManager::detach);
        return resultado;
    }

    public void upsert(RegistroDiario registro) {
        entityManager.createNativeQuery(
                        "INSERT INTO registros_diarios " +
                        "(id, habito_id, data_execucao, valor_total_dia, meta_do_dia, status, hora_conclusao, protegido_por_escudo) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?) " +
                        "ON CONFLICT (habito_id, data_execucao) DO UPDATE SET " +
                        "valor_total_dia = EXCLUDED.valor_total_dia, " +
                        "status = EXCLUDED.status, " +
                        "hora_conclusao = EXCLUDED.hora_conclusao, " +
                        "protegido_por_escudo = EXCLUDED.protegido_por_escudo")
                .setParameter(1, registro.getId() != null ? registro.getId() : UUID.randomUUID())
                .setParameter(2, registro.getHabitoId())
                .setParameter(3, registro.getDataExecucao())
                .setParameter(4, registro.getValorTotalDia())
                .setParameter(5, registro.getMetaDoDia())
                .setParameter(6, registro.getStatus())
                .setParameter(7, registro.getHoraConclusao())
                .setParameter(8, registro.getProtegidoPorEscudo())
                .executeUpdate();
    }
}
