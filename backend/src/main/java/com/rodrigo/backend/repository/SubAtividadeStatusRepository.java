package com.rodrigo.backend.repository;

import java.util.UUID;
import java.util.List;
import java.util.Optional;
import java.time.LocalDate;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;
import com.rodrigo.backend.model.SubAtividadeStatus;

@Repository
public class SubAtividadeStatusRepository {

    @PersistenceContext
    private EntityManager entityManager;

    public Optional<SubAtividadeStatus> findBySubAtividadeIdAndData(UUID subAtividadeId, LocalDate data) {
        var resultado = entityManager.createQuery(
                        "SELECT s FROM SubAtividadeStatus s WHERE s.subAtividadeId = :subAtividadeId " +
                        "AND s.dataExecucao = :data", SubAtividadeStatus.class)
                .setParameter("subAtividadeId", subAtividadeId)
                .setParameter("data", data)
                .getResultList();
        resultado.forEach(entityManager::detach);
        return resultado.stream().findFirst();
    }

    public List<SubAtividadeStatus> findByHabitoIdAndData(UUID habitoId, LocalDate data) {
        var resultado = entityManager.createQuery(
                        "SELECT s FROM SubAtividadeStatus s, SubAtividade sa " +
                        "WHERE sa.id = s.subAtividadeId AND sa.habitoId = :habitoId AND s.dataExecucao = :data",
                        SubAtividadeStatus.class)
                .setParameter("habitoId", habitoId)
                .setParameter("data", data)
                .getResultList();
        resultado.forEach(entityManager::detach);
        return resultado;
    }

    public void upsert(SubAtividadeStatus status) {
        entityManager.createNativeQuery(
                        "INSERT INTO sub_atividade_status " +
                        "(id, sub_atividade_id, data_execucao, valor_realizado, executada, moedas_creditadas) " +
                        "VALUES (?, ?, ?, ?, ?, ?) " +
                        "ON CONFLICT (sub_atividade_id, data_execucao) DO UPDATE SET " +
                        "valor_realizado = EXCLUDED.valor_realizado, " +
                        "executada = EXCLUDED.executada, " +
                        "moedas_creditadas = EXCLUDED.moedas_creditadas")
                .setParameter(1, status.getId() != null ? status.getId() : UUID.randomUUID())
                .setParameter(2, status.getSubAtividadeId())
                .setParameter(3, status.getDataExecucao())
                .setParameter(4, status.getValorRealizado())
                .setParameter(5, status.getExecutada())
                .setParameter(6, status.getMoedasCreditadas())
                .executeUpdate();
    }
}
