package com.rodrigo.backend2java.calibracao;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import com.rodrigo.backend2java.calibracao.model.Calibracao;

public interface CalibracaoRepository extends JpaRepository<Calibracao, UUID> {
}
