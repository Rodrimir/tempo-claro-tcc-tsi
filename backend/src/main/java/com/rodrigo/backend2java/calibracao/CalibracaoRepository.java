package com.rodrigo.backend2java.calibracao;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

// Tabela calibracoes — o questionário "Medir Dificuldade" (RF20/RNF04). Deixou de
// ser desenho reservado e passou a ter uso real em CalibracaoService.
public interface CalibracaoRepository extends JpaRepository<Calibracao, UUID> {

    List<Calibracao> findAllByUsuarioIdOrderByCriadoEmDesc(UUID usuarioId);
}
