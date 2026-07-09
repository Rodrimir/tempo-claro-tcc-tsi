package com.rodrigo.backend.repository;

import java.util.UUID;
import java.util.Optional;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;
import com.rodrigo.backend.model.Usuario;

@Repository
public class UsuarioRepository {

    @PersistenceContext
    private EntityManager entityManager;

    public Optional<Usuario> findById(UUID id) {
        var usuario = entityManager.find(Usuario.class, id);
        if (usuario != null) {
            entityManager.detach(usuario);
        }
        return Optional.ofNullable(usuario);
    }

    public Optional<Usuario> findByEmail(String email) {
        var resultado = entityManager.createQuery(
                        "SELECT u FROM Usuario u WHERE u.email = :email", Usuario.class)
                .setParameter("email", email)
                .getResultList();
        resultado.forEach(entityManager::detach);
        return resultado.stream().findFirst();
    }

    public boolean existsByEmail(String email) {
        Long count = entityManager.createQuery(
                        "SELECT COUNT(u) FROM Usuario u WHERE u.email = :email", Long.class)
                .setParameter("email", email)
                .getSingleResult();
        return count != null && count > 0;
    }

    public void save(Usuario usuario) {
        if (usuario.getId() == null) {
            usuario.setId(UUID.randomUUID());
        }
        entityManager.persist(usuario);
        entityManager.flush();
    }

    public void update(Usuario usuario) {
        entityManager.merge(usuario);
        entityManager.flush();
    }

    public void delete(UUID id) {
        var referencia = entityManager.getReference(Usuario.class, id);
        entityManager.remove(referencia);
        entityManager.flush();
    }
}
