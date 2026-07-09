package com.rodrigo.backend.repository;

import java.util.UUID;
import java.util.Optional;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Repository;
import com.rodrigo.backend.model.BibliotecaTexto;

@Repository
public class BibliotecaTextoRepository {

    @PersistenceContext
    private EntityManager entityManager;

    public Optional<BibliotecaTexto> findByCategoriaIdAndIdioma(UUID categoriaId, String idioma) {
        var resultado = entityManager.createQuery(
                        "SELECT b FROM BibliotecaTexto b WHERE b.categoriaId = :categoriaId AND b.idioma = :idioma",
                        BibliotecaTexto.class)
                .setParameter("categoriaId", categoriaId)
                .setParameter("idioma", idioma)
                .getResultList();
        resultado.forEach(entityManager::detach);
        return resultado.stream().findFirst();
    }

    public Optional<BibliotecaTexto> findGenericoByIdioma(String idioma) {
        var resultado = entityManager.createQuery(
                        "SELECT b FROM BibliotecaTexto b WHERE b.categoriaId IS NULL AND b.idioma = :idioma",
                        BibliotecaTexto.class)
                .setParameter("idioma", idioma)
                .getResultList();
        resultado.forEach(entityManager::detach);
        return resultado.stream().findFirst();
    }
}
