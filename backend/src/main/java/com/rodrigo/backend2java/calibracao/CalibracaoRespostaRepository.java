package com.rodrigo.backend2java.calibracao;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import com.rodrigo.backend2java.calibracao.model.CalibracaoResposta;

public interface CalibracaoRespostaRepository extends JpaRepository<CalibracaoResposta, UUID> {

    List<CalibracaoResposta> findAllByCalibracaoId(UUID calibracaoId);
}
