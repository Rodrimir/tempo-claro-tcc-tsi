package com.rodrigo.backend2java.calibracao;
import java.util.UUID;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

// @audit-ok [Schema v2.1, tabela calibracao_respostas — repositório criado na
// E0.5.3 só para existir (D4: trabalho futuro). Sem uso em nenhum service.]
public interface CalibracaoRespostaRepository extends JpaRepository<CalibracaoResposta, UUID> {

    List<CalibracaoResposta> findAllByCalibracaoId(UUID calibracaoId);
}
