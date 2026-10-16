package com.rodrigo.backend2java.biblioteca;
import java.util.UUID;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.rodrigo.backend2java.biblioteca.model.BibliotecaTexto;

public interface BibliotecaTextoRepository extends JpaRepository<BibliotecaTexto, UUID> {

    Optional<BibliotecaTexto> findByCategoriaAndIdioma(String categoria, String idioma);
}
