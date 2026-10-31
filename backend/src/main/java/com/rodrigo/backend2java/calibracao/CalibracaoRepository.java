package com.rodrigo.backend2java.calibracao;
import java.util.List;
import java.util.UUID;
import java.time.OffsetDateTime;
import org.springframework.data.jpa.repository.JpaRepository;
import com.rodrigo.backend2java.calibracao.model.Calibracao;

public interface CalibracaoRepository extends JpaRepository<Calibracao, UUID> {

    List<Calibracao> findAllByUsuarioIdAndCategoriaAndHabitoIdIsNullAndCriadoEmAfterOrderByCriadoEmDesc(
            UUID usuarioId, String categoria, OffsetDateTime criadoEmApos);
}
