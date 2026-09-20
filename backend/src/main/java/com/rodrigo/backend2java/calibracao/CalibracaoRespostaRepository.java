package com.rodrigo.backend2java.calibracao;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CalibracaoRespostaRepository extends JpaRepository<CalibracaoResposta, UUID> {
}
