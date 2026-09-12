package com.rodrigo.backend2java.biblioteca;
import java.util.UUID;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

// @audit-ok [Schema v2.1 — tabela biblioteca_textos agora usa prefixo bib_*.
// A carga inicial (antes em data.sql) passou para a Seção 11 do schema.sql.]
public interface BibliotecaTextoRepository extends JpaRepository<BibliotecaTexto, UUID> {

    Optional<BibliotecaTexto> findByCategoriaAndIdioma(String categoria, String idioma);
}
