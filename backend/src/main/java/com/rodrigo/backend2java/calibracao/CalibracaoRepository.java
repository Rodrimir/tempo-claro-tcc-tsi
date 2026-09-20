package com.rodrigo.backend2java.calibracao;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CalibracaoRepository extends JpaRepository<Calibracao, UUID> {
}
